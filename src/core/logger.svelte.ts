export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
	id: number;
	ts: number;
	level: LogLevel;
	message: string;
	source: string;
	data?: unknown;
}

const STORAGE_KEY = "s21-helper:logs";
export const LOG_STORAGE_KEY = STORAGE_KEY;

const MAX = 300;
const MAX_MESSAGE_LEN = 2000;
const PERSIST_DEBOUNCE_MS = 300;

export const logs = $state<LogEntry[]>([]);

let seq = 0;
let initialized = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function sanitize(value: unknown): unknown {
	if (value === undefined || value === null) return undefined;
	try {
		JSON.stringify(value);
		return value;
	} catch {
		return String(value);
	}
}

function schedulePersist() {
	if (!isChromeExt || !chrome.storage?.local) return;
	if (persistTimer) return;
	persistTimer = setTimeout(() => {
		persistTimer = null;
		persist();
	}, PERSIST_DEBOUNCE_MS);
}

function persist() {
	if (!isChromeExt || !chrome.storage?.local) return;
	const snapshot = logs.map((entry) => ({ ...entry, data: sanitize(entry.data) }));
	void chrome.storage.local.set({ [STORAGE_KEY]: snapshot });
}

export function log(level: LogLevel, message: string, source = "app", data?: unknown) {
	const text = typeof message === "string" ? message : String(message);
	const entry: LogEntry = {
		id: seq++,
		ts: Date.now(),
		level,
		source: source || "app",
		message: text.length > MAX_MESSAGE_LEN ? `${text.slice(0, MAX_MESSAGE_LEN)}…` : text,
		data: sanitize(data),
	};
	logs.unshift(entry);
	if (logs.length > MAX) logs.length = MAX;

	const label = `[s21-helper] ${entry.source}:`;
	const args: unknown[] = data === undefined ? [entry.message] : [entry.message, data];
	if (level === "error") {
		console.error(label, ...args);
	} else if (level === "warn") {
		console.warn(label, ...args);
	} else if (level === "debug") {
		console.debug(label, ...args);
	} else {
		console.log(label, ...args);
	}

	schedulePersist();
}

export function logDebug(message: string, source = "app", data?: unknown) {
	log("debug", message, source, data);
}
export function logInfo(message: string, source = "app", data?: unknown) {
	log("info", message, source, data);
}
export function logWarn(message: string, source = "app", data?: unknown) {
	log("warn", message, source, data);
}
export function logError(message: string, source = "app", data?: unknown) {
	log("error", message, source, data);
}

/** Немедленно сбрасывает накопленные записи в chrome.storage. */
export function flushLogs() {
	if (persistTimer) {
		clearTimeout(persistTimer);
		persistTimer = null;
	}
	persist();
}

export function initLogger() {
	if (initialized) return;
	initialized = true;
	if (!isChromeExt || !chrome.storage) return;

	chrome.storage.local.get({ [STORAGE_KEY]: [] }, (items) => {
		const arr = items[STORAGE_KEY];
		if (Array.isArray(arr)) {
			logs.splice(0, logs.length, ...arr.map(normalizeEntry));
			seq = arr.reduce((max, e) => Math.max(max, Number(e?.id) || 0), seq);
		}
	});
	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === "local" && changes[STORAGE_KEY]) {
			const arr = changes[STORAGE_KEY].newValue;
			if (Array.isArray(arr)) logs.splice(0, logs.length, ...arr.map(normalizeEntry));
		}
	});

	logInfo("logger initialized", "logger");
}

function normalizeEntry(raw: unknown): LogEntry {
	const e = (raw ?? {}) as Partial<LogEntry>;
	return {
		id: Number(e.id) || 0,
		ts: Number(e.ts) || 0,
		level: LEVEL_ORDER[e.level as LogLevel] === undefined ? "info" : (e.level as LogLevel),
		message: typeof e.message === "string" ? e.message : String(e.message ?? ""),
		source: typeof e.source === "string" ? e.source : "app",
		data: e.data,
	};
}

export function clearLogs() {
	logs.splice(0, logs.length);
	if (persistTimer) {
		clearTimeout(persistTimer);
		persistTimer = null;
	}
	if (isChromeExt && chrome.storage?.local) {
		void chrome.storage.local.set({ [STORAGE_KEY]: [] });
	}
}
