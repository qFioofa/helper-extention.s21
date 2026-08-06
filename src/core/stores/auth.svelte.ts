import { AUTH_STORAGE_KEY, type AuthStatus } from "../../infra/chrome/auth";

export const auth = $state<{ status: AuthStatus }>({ status: "unknown" });

const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

const MESSAGE_TIMEOUT_MS = 4000;

function isValidStatus(v: unknown): v is AuthStatus {
	return v === "authorized" || v === "unauthorized" || v === "offline" || v === "unknown";
}

async function send(type: string): Promise<void> {
	if (!isChromeExt) {
		auth.status = "offline";
		return;
	}
	try {
		const res = await withTimeout(chrome.runtime.sendMessage({ type }), MESSAGE_TIMEOUT_MS);
		if (res && typeof res.status === "string" && isValidStatus(res.status)) {
			auth.status = res.status;
		}
	} catch {
		auth.status = "offline";
	}
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("timeout")), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}

let initialized = false;

export function initAuthStore() {
	if (initialized) return;
	initialized = true;
	if (isChromeExt && chrome.storage?.onChanged) {
		chrome.storage.local.get({ [AUTH_STORAGE_KEY]: "unknown" }, (items) => {
			const v = items[AUTH_STORAGE_KEY];
			if (isValidStatus(v)) auth.status = v;
		});
		chrome.storage.onChanged.addListener((changes, area) => {
			if (area === "local" && isValidStatus(changes[AUTH_STORAGE_KEY]?.newValue)) {
				auth.status = changes[AUTH_STORAGE_KEY].newValue as AuthStatus;
			}
		});
	}
	void send("auth:status");
	// Повторный запрос, если фон молчит (worker мог ещё не проснуться).
	setTimeout(() => {
		if (auth.status === "unknown") void send("auth:status");
	}, 3000);
}

export function requestLogin() {
	void send("auth:login");
}

export function requestLogout() {
	void send("auth:logout");
}

export async function registerWithPassword(
	username: string,
	password: string,
): Promise<{ ok: boolean; error?: string }> {
	if (!isChromeExt) return { ok: false, error: "Доступно только внутри расширения" };
	try {
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type: "auth:register", username, password }),
			10_000,
		);
		if (res?.ok) {
			auth.status = isValidStatus(res.status) ? res.status : "authorized";
			return { ok: true };
		}
		return { ok: false, error: typeof res?.error === "string" ? res.error : "Неизвестная ошибка" };
	} catch {
		return { ok: false, error: "Нет ответа от фона (таймаут)" };
	}
}