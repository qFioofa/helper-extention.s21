import { S21_PLATFORM_ORIGIN } from "@qfioofa/s21-api";
import { probeAuth, type AuthStatus } from "../../api/session";
import { logInfo } from "../../core/logger.svelte";
import { clearStoredToken } from "./token";

export type { AuthStatus } from "../../api/session";

export const AUTH_STORAGE_KEY = "s21-helper:auth";

const PROBE_ALARM = "s21-helper:probe";
const PROBE_INTERVAL_MIN = 1;
/** Настоящий сетевой probe запускается не чаще одного раза в этот интервал. */
const CACHE_TTL_MS = 60_000;
const PROBE_ATTEMPTS = 20;
const PROBE_DELAY_MS = 2000;

async function persist(status: AuthStatus) {
	await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: status });
}

// ---- Кэш/дедупликация probe: сеть не трогаем чаще, чем раз в TTL ---------
// Метка последнего probe хранится в storage.local (поддерживается и Chrome, и
// Firefox) — переживает перезапуск service worker, поэтому кэш не сбрасывается
// при «засыпании» и probe не стартует заново на каждое событие.

const DEBOUNCE_KEY = "s21-helper:auth-probe-at";

let cachedStatus: AuthStatus = "unknown";
let hydrated = false;
let inFlight: Promise<AuthStatus> | null = null;
let memProbeAt = 0;

function validStatus(v: unknown): v is AuthStatus {
	return v === "authorized" || v === "unauthorized" || v === "offline" || v === "unknown";
}

async function hydrateCache() {
	if (hydrated) return;
	hydrated = true;
	const data = await chrome.storage.local.get({ [AUTH_STORAGE_KEY]: "unknown" });
	if (validStatus(data[AUTH_STORAGE_KEY])) cachedStatus = data[AUTH_STORAGE_KEY];
}

async function lastProbeAt(): Promise<number> {
	const data = await chrome.storage.local.get({ [DEBOUNCE_KEY]: 0 });
	return Number(data[DEBOUNCE_KEY]) || memProbeAt || 0;
}

async function markProbeAt() {
	await chrome.storage.local.set({ [DEBOUNCE_KEY]: Date.now() });
	memProbeAt = Date.now();
}

function probeNetwork(): Promise<AuthStatus> {
	if (inFlight) return inFlight;
	inFlight = (async () => {
		const status = await probeAuth();
		cachedStatus = status;
		await persist(status);
		await markProbeAt();
		logInfo("auth probe", "auth", { status });
		return status;
	})();
	return inFlight.finally(() => {
		inFlight = null;
	});
}

/** Статус с использованием кэша — быстрый и без лишнего трафика. */
export async function getAuthStatus(): Promise<AuthStatus> {
	await hydrateCache();
	if (Date.now() - (await lastProbeAt()) < CACHE_TTL_MS) {
		return cachedStatus;
	}
	return probeNetwork();
}

/** Принудительная проверка (для логина/логаута). */
export function forceStatusCheck(): Promise<AuthStatus> {
	return probeNetwork();
}

export async function login(): Promise<AuthStatus> {
	logInfo("login requested", "auth");
	await ensurePlatformTab();
	const status = await forceStatusCheck();
	void pollUntilAuthorized();
	return status;
}

export async function logout(): Promise<AuthStatus> {
	logInfo("logout requested", "auth");
	await clearSessionCookies();
	await clearStoredToken();
	const status = await probeAuth();
	await persist(status);
	return status;
}

// ---- Глобальная синхронизация между вкладками/контекстами ----------------

let syncRegistered = false;

/**
 * Регистрирует слушатели, обновляющие статус авторизации:
 * - при старте/установке расширения;
 * - при завершении загрузки вкладки платформы;
 * - периодически по таймеру (alarms).
 *
 * Все вызовы идут через кэш-debounce (getAuthStatus), поэтому сетевой probe
 * выполняется максимум раз в CACHE_TTL_MS, независимо от числа событий.
 * Статус кладётся в chrome.storage.local и раздаётся всем вкладкам через
 * storage.onChanged.
 */
export function registerGlobalSync() {
	if (syncRegistered) return;
	syncRegistered = true;

	chrome.runtime.onInstalled.addListener(() => {
		void getAuthStatus();
	});
	chrome.runtime.onStartup.addListener(() => {
		void getAuthStatus();
	});

	chrome.tabs.onUpdated.addListener((_tabId, info, tab) => {
		if (info.status === "complete" && tab.url?.startsWith(S21_PLATFORM_ORIGIN)) {
			void getAuthStatus();
		}
	});

	chrome.alarms.onAlarm.addListener((alarm) => {
		if (alarm.name === PROBE_ALARM) void getAuthStatus();
	});
	try {
		void chrome.alarms.create(PROBE_ALARM, { periodInMinutes: PROBE_INTERVAL_MIN });
	} catch {
		/* alarms могут быть недоступны в некоторых браузерах */
	}
}

// ---- Внутренние помощники -------------------------------------------------

function forceStatus(): Promise<AuthStatus> {
	return forceStatusCheck();
}

async function ensurePlatformTab() {
	const tabs = await chrome.tabs.query({ url: `${S21_PLATFORM_ORIGIN}/*` });
	if (tabs.length > 0 && tabs[0].id != null) {
		await chrome.tabs.update(tabs[0].id, { active: true });
		return;
	}
	await chrome.tabs.create({ url: S21_PLATFORM_ORIGIN, active: true });
}

async function pollUntilAuthorized() {
	for (let i = 0; i < PROBE_ATTEMPTS; i++) {
		const status = await forceStatus();
		if (status === "authorized") return;
		await new Promise((resolve) => setTimeout(resolve, PROBE_DELAY_MS));
	}
}

async function clearSessionCookies() {
	const hosts = ["platform.21-school.ru", "21-school.ru"];
	for (const host of hosts) {
		const cookies = await chrome.cookies.getAll({ domain: host });
		for (const cookie of cookies) {
			const url = `${cookie.secure ? "https" : "http"}://${host}${cookie.path}`;
			await chrome.cookies.remove({ url, name: cookie.name });
		}
	}
}
