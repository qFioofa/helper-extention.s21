import { backgroundClient } from "../../api/client";
import { logDebug, logInfo, logWarn } from "../../core/logger.svelte";

export const TOKEN_STORAGE_KEY = "s21-helper:token";

const AUTH_TOKEN_URL =
	"https://auth.21-school.ru/auth/realms/EduPowerKeycloak/protocol/openid-connect/token";
const CLIENT_ID = "s21-open-api";
const EXPIRY_MARGIN_MS = 30_000;

interface TokenPayload {
	access_token: string;
	refresh_token?: string;
	expires_at: number;
	refresh_expires_at: number;
}

let cached: TokenPayload | null = null;
let hydrated = false;

function applyToClient(token: string | null) {
	if (token) backgroundClient.transport.setAuthToken(token);
	else backgroundClient.transport.clearAuthToken();
}

async function persist() {
	applyToClient(cached?.access_token ?? null);
	if (!cached) {
		await chrome.storage.local.remove(TOKEN_STORAGE_KEY);
		return;
	}
	await chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: cached });
}

async function hydrate() {
	if (hydrated) return;
	hydrated = true;
	const data = await chrome.storage.local.get({ [TOKEN_STORAGE_KEY]: null });
	const v = data[TOKEN_STORAGE_KEY];
	if (v && typeof v === "object" && typeof (v as TokenPayload).access_token === "string") {
		cached = v as TokenPayload;
		applyToClient(cached.access_token);
	}
}

async function postToken(body: URLSearchParams): Promise<TokenPayload> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10_000);
	let res: Response;
	try {
		res = await fetch(AUTH_TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: body.toString(),
			signal: controller.signal,
		});
	} catch (err) {
		clearTimeout(timer);
		throw err;
	}
	clearTimeout(timer);
	const text = await res.text();
	if (!res.ok) {
		let msg = `HTTP ${res.status}`;
		try {
			const err = JSON.parse(text) as { error_description?: string; error?: string };
			msg = err.error_description || err.error || msg;
		} catch {
			/* not json */
		}
		throw new Error(msg);
	}
	const data = JSON.parse(text) as {
		access_token?: string;
		refresh_token?: string;
		expires_in?: number;
		refresh_expires_in?: number;
	};
	if (typeof data.access_token !== "string" || !data.access_token) {
		throw new Error("no access_token in response");
	}
	const now = Date.now();
	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token,
		expires_at: now + (data.expires_in || 0) * 1000 - EXPIRY_MARGIN_MS,
		refresh_expires_at: now + (data.refresh_expires_in || 0) * 1000,
	};
}

/** Логин через логин/пароль (Keycloak password grant). */
export async function loginWithPassword(
	username: string,
	password: string,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const body = new URLSearchParams({
			grant_type: "password",
			client_id: CLIENT_ID,
			username,
			password,
		});
		cached = await postToken(body);
		await persist();
		void rememberUsername(username);
		logInfo("password login ok", "auth", { expires_at: cached.expires_at });
		return { ok: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		logWarn("password login failed", "auth", { error: message, username });
		return { ok: false, error: message };
	}
}

async function refreshToken(): Promise<boolean> {
	if (!cached?.refresh_token) return false;
	try {
		const body = new URLSearchParams({
			grant_type: "refresh_token",
			client_id: CLIENT_ID,
			refresh_token: cached.refresh_token,
		});
		cached = await postToken(body);
		await persist();
		logDebug("token refreshed", "auth", { expires_at: cached.expires_at });
		return true;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		logWarn("refresh_token failed", "auth", { error: message });
		cached = null;
		await persist();
		return false;
	}
}

/** Возвращает валидный access_token (с автообновлением), или null. */
export async function getAccessToken(): Promise<string | null> {
	await hydrate();
	if (!cached?.access_token) return null;
	if (Date.now() > cached.expires_at) {
		const ok = await refreshToken();
		if (!ok) return null;
	}
	return cached.access_token;
}

export async function getStoredToken(): Promise<string | null> {
	await hydrate();
	return cached?.access_token ?? null;
}

/**
 * Возвращает текущий логин из JWT (preferred_username), не проверяя подпись.
 * Фоллбэк: сохранённый логин из chrome.storage (для cookie-сессий без bearer).
 */
export async function getCurrentUsername(): Promise<string | null> {
	const token = await getAccessToken();
	const fromJwt = token ? usernameFromJwt(token) : null;
	if (fromJwt) {
		void rememberUsername(fromJwt);
		return fromJwt;
	}
	try {
		const data = await chrome.storage.local.get({ [STORED_LOGIN_KEY]: null });
		const stored = data[STORED_LOGIN_KEY];
		return typeof stored === "string" && stored ? stored : null;
	} catch {
		return null;
	}
}

export const STORED_LOGIN_KEY = "s21-helper:login";

function usernameFromJwt(token: string): string | null {
	const [, payloadB64] = token.split(".");
	if (!payloadB64) return null;
	try {
		const payload = JSON.parse(decodeBase64Url(payloadB64)) as {
			preferred_username?: unknown;
		};
		return typeof payload.preferred_username === "string" && payload.preferred_username
			? payload.preferred_username
			: null;
	} catch {
		return null;
	}
}

/** Сохраняет текущий логин, чтобы «Мой профиль» работал и без bearer-токена. */
export async function rememberUsername(username: string) {
	if (!username) return;
	try {
		await chrome.storage.local.set({ [STORED_LOGIN_KEY]: username });
	} catch {
		/* ignore */
	}
}

function decodeBase64Url(input: string): string {
	const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
	const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
	return atob(b64 + pad);
}

export async function clearStoredToken() {
	cached = null;
	await persist();
	logInfo("token cleared", "auth");
}
