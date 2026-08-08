import { S21HttpError, S21_PLATFORM_ORIGIN } from "@qfioofa/s21-api";
import {
	getAuthStatus,
	login as loginAuth,
	logout as logoutAuth,
	registerGlobalSync,
} from "./infra/chrome/auth";
import {
	clearStoredToken,
	getAccessToken,
	getCurrentUsername,
	getStoredToken,
	STORED_LOGIN_KEY,
	loginWithPassword,
	rememberUsername,
} from "./infra/chrome/token";
import { getCookies } from "./infra/chrome/cookies";
import { getPopupShortcut, TOGGLE_PANEL_COMMAND } from "./infra/chrome/commands";
import { backgroundClient } from "./api/session";
import { fetchFullProfile } from "./api/peer";
import { logError, logInfo, logWarn } from "./core/logger.svelte";

export const s21Client = backgroundClient;

const PANEL_URLS = [S21_PLATFORM_ORIGIN + "/*", "https://auth.21-school.ru/*"];

/** Переключает панель расширения (правый нижний угол) во всех открытых вкладках платформы. */
async function togglePanelInTabs() {
	try {
		const tabs = await chrome.tabs.query({ url: PANEL_URLS });
		for (const tab of tabs) {
			if (tab.id == null) continue;
			try {
				await chrome.tabs.sendMessage(tab.id, { type: "panel:toggle" });
			} catch {
				/* контент-скрипт может быть ещё не готов */
			}
		}
	} catch (err) {
		logWarn(`togglePanelInTabs: ${err}`, "background");
	}
}

chrome.commands.onCommand.addListener((command) => {
	if (command === TOGGLE_PANEL_COMMAND) {
		void togglePanelInTabs();
	}
});

function errPayload(err: unknown) {
	if (err instanceof S21HttpError) {
		return { status: err.status, statusText: err.statusText, body: err.body };
	}
	return { message: String(err) };
}

/** Читает только сохранённый вручную логин из chrome.storage. */
async function getStoredUsername(): Promise<string | null> {
	try {
		const data = await chrome.storage.local.get({ [STORED_LOGIN_KEY]: null });
		const v = data[STORED_LOGIN_KEY];
		return typeof v === "string" && v ? v : null;
	} catch {
		return null;
	}
}

/** Пытается узнать текущий логин: из токена сохранённого, либо со страницы платформы. */
async function resolveCurrentUsername(): Promise<string | null> {
	const cached = await getCurrentUsername();
	if (cached) return cached;
	try {
		const tabs = await chrome.tabs.query({ url: S21_PLATFORM_ORIGIN + "/*" });
		for (const tab of tabs) {
			if (tab.id == null) continue;
			try {
				const res = await chrome.tabs.sendMessage(tab.id, { type: "login:detect" });
				if (res && typeof res.login === "string" && res.login) {
					void rememberUsername(res.login);
					return res.login;
				}
			} catch {
				/* content-скрипт может ещё не быть готов */
			}
		}
	} catch (err) {
		logWarn(`resolveCurrentUsername: ${err}`, "background");
	}
	return null;
}

/** Спрашивает у контент-скрипта вкладки логин с задержкой на загрузку страницы. */
async function detectLoginInTab(tabId: number): Promise<string | null> {
	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			const res = await chrome.tabs.sendMessage(tabId, { type: "login:detect" });
			if (res && typeof res.login === "string" && res.login) return res.login;
		} catch {
			/* content-скрипт ещё не готов */
		}
		await new Promise((resolve) => setTimeout(resolve, 1500));
	}
	return null;
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
		case "shortcut:native":
			getPopupShortcut().then(
				(shortcut) => sendResponse({ shortcut }),
				() => sendResponse({ shortcut: null }),
			);
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
					backgroundClient.participant
						.getByLogin(login.trim())
						.then((data) => ({ data })),
				)
				.then((r) => sendResponse(r))
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		}
		case "profile:stored-login": {
			getStoredUsername()
				.then((login) => sendResponse({ login: login ?? null }))
				.catch((err) => sendResponse({ login: null, error: errPayload(err) }));
			return true;
		}
		case "profile:set-login": {
			const login = message?.login;
			if (typeof login !== "string" || !login.trim()) {
				sendResponse({ ok: false, error: "login required" });
				return false;
			}
			rememberUsername(login.trim()).then(() => sendResponse({ ok: true }));
			return true;
		}
		case "profile:login": {
			void (async () => {
				const login = await resolveCurrentUsername();
				if (login) {
					sendResponse({ login });
					return;
				}
				// Вариант A: авторизация по кукам — открываем платформу, чтобы
				// контент-скрипт определил логин, и сохраняем его.
				try {
					const tabs = await chrome.tabs.query({ url: S21_PLATFORM_ORIGIN + "/*" });
					let tab = tabs.find((t) => t.id != null);
					if (!tab) {
						tab = await chrome.tabs.create({ url: S21_PLATFORM_ORIGIN, active: false });
					}
					const tabId = tab.id;
					if (tabId != null) {
						const detected = await detectLoginInTab(tabId);
						if (detected) {
							void rememberUsername(detected);
							sendResponse({ login: detected });
							return;
						}
					}
				} catch (err) {
					logWarn(`profile:login platform detect failed: ${err}`, "background");
				}
				sendResponse({ login: null });
			})();
			return true;
		}
		case "api:participant:full": {
			const login = message?.login;
			const run = (target: string) =>
				getAccessToken()
					.then(() => fetchFullProfile(target).then((data) => ({ data })))
					.then((r) => sendResponse(r))
					.catch((err) => sendResponse({ error: errPayload(err) }));
			if (typeof login === "string" && login.trim()) {
				void run(login.trim());
				return true;
			}
			// Без логина — текущий пользователь (профиль).
			resolveCurrentUsername()
				.then((name) => {
					if (!name) {
						sendResponse({ error: { message: "not authorized" } });
						return;
					}
					void rememberUsername(name);
					run(name);
				})
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		}
		case "api:campus:list": {
			getAccessToken()
				.then(() => backgroundClient.campus.getCampuses().then((data) => ({ data })))
				.then((r) => sendResponse(r))
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		}
		case "api:campus:clusters": {
			const campusId = message?.campusId;
			if (typeof campusId !== "string" || !campusId.trim()) {
				sendResponse({ error: { message: "campusId required" } });
				return false;
			}
			getAccessToken()
				.then(() =>
					backgroundClient.campus.getClusters(campusId.trim()).then((data) => ({ data })),
				)
				.then((r) => sendResponse(r))
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		}
		case "api:sales": {
			getAccessToken()
				.then(() => backgroundClient.sale.getSales().then((data) => ({ data })))
				.then((r) => sendResponse(r))
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		}
		case "api:events": {
			const from = message?.from;
			const to = message?.to;
			const limit = message?.limit;
			getAccessToken()
				.then(() =>
					backgroundClient.event
						.getEvents({
							from: typeof from === "string" ? from : new Date().toISOString(),
							to:
								typeof to === "string"
									? to
									: new Date(Date.now() + 2592e6).toISOString(),
							limit: typeof limit === "number" ? limit : 20,
						})
						.then((data) => ({ data })),
				)
				.then((r) => sendResponse(r))
				.catch((err) => sendResponse({ error: errPayload(err) }));
			return true;
		}
		default:
			sendResponse({ error: "unknown message type" });
	}
});
