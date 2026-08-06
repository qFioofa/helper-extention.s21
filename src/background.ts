import { S21HttpError } from "@s21/api";
import {
	getAuthStatus,
	login as loginAuth,
	logout as logoutAuth,
	registerGlobalSync,
} from "./infra/chrome/auth";
import {
	clearStoredToken,
	getAccessToken,
	getStoredToken,
	loginWithPassword,
} from "./infra/chrome/token";
import { getCookies } from "./infra/chrome/cookies";
import { backgroundClient } from "./api/session";
import { logError, logInfo } from "./core/logger.svelte";

export const s21Client = backgroundClient;

function errPayload(err: unknown) {
	if (err instanceof S21HttpError) {
		return { status: err.status, statusText: err.statusText, body: err.body };
	}
	return { message: String(err) };
}

try {
	registerGlobalSync();
} catch (err) {
	logError(`global sync registration failed: ${err}`, "background");
}
// Первый probe сразу при старте воркера (виден в Network service worker).
void getAuthStatus();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	switch (message?.type) {
		case "PING":
			sendResponse({ pong: true });
			break;
		case "auth:status":
			getAuthStatus().then(
				(status) => sendResponse({ status }),
				() => sendResponse({ status: "offline" }),
			);
			return true;
		case "auth:login":
			loginAuth().then(
				(status) => sendResponse({ status }),
				() => sendResponse({ status: "offline" }),
			);
			return true;
		case "auth:logout":
			logoutAuth().then(
				(status) => sendResponse({ status }),
				() => sendResponse({ status: "offline" }),
			);
			return true;
		case "auth:register": {
			const username = message?.username;
			const password = message?.password;
			if (typeof username !== "string" || typeof password !== "string") {
				sendResponse({ ok: false, error: "credentials required" });
				return false;
			}
			logInfo(`auth:register received for ${username}`, "background");
			loginWithPassword(username, password)
				.then((r) => sendResponse({ ...r, status: r.ok ? "authorized" : "unauthorized" }))
				.catch((err) => sendResponse({ ok: false, error: String(err) }));
			return true;
		}
		case "token:get":
			getStoredToken()
				.then((token) => sendResponse({ token }))
				.catch(() => sendResponse({ token: null }));
			return true;
		case "token:clear":
			void clearStoredToken().then(() => sendResponse({ ok: true }));
			return true;
		case "cookies:get":
			getCookies()
				.then((cookies) => sendResponse({ cookies }))
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		case "api:participant": {
			const login = message?.login;
			if (typeof login !== "string" || !login.trim()) {
				sendResponse({ error: { message: "login required" } });
				return false;
			}
			getAccessToken()
				.then(() =>
					backgroundClient.participant.getByLogin(login.trim()).then((data) => ({ data })),
				)
				.then((r) => sendResponse(r))
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		}
		default:
			sendResponse({ error: "unknown message type" });
	}
});