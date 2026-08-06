export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
	id: number;
	ts: number;
	level: LogLevel;
	message: string;
	source: string;
}

const STORAGE_KEY = "s21-helper:logs";
export const LOG_STORAGE_KEY = STORAGE_KEY;

const MAX = 300;

export const logs = $state<LogEntry[]>([]);

let seq = 0;
let initialized = false;

const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

function persist() {
	if (!isChromeExt || !chrome.storage?.local) return;
	// Копия массива: $state-прокси может не клонироваться в chrome.storage.
	void chrome.storage.local.set({ [STORAGE_KEY]: logs.map((entry) => ({ ...entry })) });
}

export function log(level: LogLevel, message: string, source = "app") {
	const entry: LogEntry = { id: seq++, ts: Date.now(), level, message, source };
	logs.unshift(entry);
	if (logs.length > MAX) logs.length = MAX;

	if (level === "error") {
		console.error(`[s21-helper] ${source}:`, message);
	} else if (level === "warn") {
		console.warn(`[s21-helper] ${source}:`, message);
	} else {
		console.log(`[s21-helper] ${source}:`, message);
	}

	persist();
}

export function logInfo(message: string, source = "app") {
	log("info", message, source);
}
export function logWarn(message: string, source = "app") {
	log("warn", message, source);
}
export function logError(message: string, source = "app") {
	log("error", message, source);
}

export function initLogger() {
	if (initialized) return;
	initialized = true;
	if (!isChromeExt || !chrome.storage) return;

	chrome.storage.local.get({ [STORAGE_KEY]: [] }, (items) => {
		const arr = items[STORAGE_KEY];
		if (Array.isArray(arr)) logs.splice(0, logs.length, ...arr);
	});
	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === "local" && changes[STORAGE_KEY]) {
			const arr = changes[STORAGE_KEY].newValue;
			if (Array.isArray(arr)) logs.splice(0, logs.length, ...arr);
		}
	});

	logInfo("logger initialized", "logger");
}

export function clearLogs() {
	logs.splice(0, logs.length);
	if (isChromeExt && chrome.storage?.local) {
		void chrome.storage.local.set({ [STORAGE_KEY]: [] });
	}
}