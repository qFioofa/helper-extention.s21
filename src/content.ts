import { mount } from "svelte";
import { S21Client, S21_API_PATH_PREFIX } from "@qfioofa/s21-api";
import App from "./App.svelte";
import { setThemeRoot } from "./core/stores/theme.svelte";
import { eventToShortcut } from "./core/keybinding";
import { DEFAULT_SHORTCUT, SHORTCUT_STORAGE_KEY } from "./infra/chrome/commands";
import appCss from "./app.css?inline";

// В контексте страницы платформы запросы идут same-origin с сессионными куками.
export const s21Client = new S21Client({
	baseUrl: `${location.origin}${S21_API_PATH_PREFIX}`,
});

// ---- Детект текущего логина по данным SPA платформы ------------------------
const JWT_RE = /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g;

function decodeJwtUsername(raw: string): string | null {
	const candidates = raw.match(JWT_RE);
	if (!candidates) return null;
	for (const token of candidates) {
		try {
			const payloadB64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
			if (!payloadB64) continue;
			const payload = JSON.parse(atob(payloadB64)) as { preferred_username?: unknown };
			if (typeof payload.preferred_username === "string" && payload.preferred_username) {
				return payload.preferred_username;
			}
		} catch {
			/* не JWT */
		}
	}
	return null;
}

function detectUsernameFromStorage(): string | null {
	for (const store of [window.localStorage, window.sessionStorage]) {
		try {
			for (let i = 0; i < store.length; i++) {
				const key = store.key(i);
				if (!key) continue;
				const value = store.getItem(key) ?? "";
				const fromKey = decodeJwtUsername(key);
				if (fromKey) return fromKey;
				const fromValue = decodeJwtUsername(value);
				if (fromValue) return fromValue;
			}
		} catch {
			/* storage может быть недоступен */
		}
	}
	return null;
}

function detectUsernameFromDom(): string | null {
	const selectors = [
		"[data-login]",
		"[data-username]",
		"[data-testid='profile-menu'] [class*='user']",
		".profile-menu",
		"[class*='user-menu'] a[href*='/user/']",
	];
	for (const sel of selectors) {
		try {
			const el = document.querySelector<HTMLElement>(sel);
			if (!el) continue;
			const text = el.getAttribute("data-login") || el.getAttribute("data-username") || "";
			if (text.trim()) return text.trim();
		} catch {
			/* ignore */
		}
	}
	return null;
}

export function detectCurrentLogin(): string | null {
	return detectUsernameFromStorage() ?? detectUsernameFromDom();
}

const HOST_ID = "s21-helper-host";
const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 560;

function initWidget() {
	if (document.getElementById(HOST_ID)) return;

	const host = document.createElement("div");
	host.id = HOST_ID;
	host.style.cssText = `
		position: fixed;
		right: 16px;
		bottom: 16px;
		width: 0;
		height: 0;
		z-index: 2147483647;
		font-family: system-ui, -apple-system, sans-serif;
	`;

	const shadow = host.attachShadow({ mode: "open" });

	const style = document.createElement("style");
	style.textContent = appCss;
	shadow.appendChild(style);

	const fab = document.createElement("button");
	fab.type = "button";
	fab.setAttribute("aria-label", "Helper S21");
	fab.style.cssText = `
		position: absolute;
		right: 0;
		bottom: 0;
		width: 48px;
		height: 48px;
		border: none;
		border-radius: 50%;
		background: #2563eb;
		color: #ffffff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
		transition: transform 0.15s ease, background 0.15s ease;
	`;
	fab.style.setProperty("background", "#2563eb");
	const NS = "http://www.w3.org/2000/svg";
	const fabIcon = document.createElementNS(NS, "svg");
	fabIcon.setAttribute("width", "22");
	fabIcon.setAttribute("height", "22");
	fabIcon.setAttribute("viewBox", "0 0 24 24");
	fabIcon.setAttribute("fill", "none");
	fabIcon.setAttribute("stroke", "currentColor");
	fabIcon.setAttribute("stroke-width", "2");
	fabIcon.setAttribute("stroke-linecap", "round");
	fabIcon.setAttribute("stroke-linejoin", "round");
	fabIcon.setAttribute("aria-hidden", "true");
	const gridRects = [
		{ x: "3", y: "3" },
		{ x: "14", y: "3" },
		{ x: "14", y: "14" },
		{ x: "3", y: "14" },
	];
	for (const r of gridRects) {
		const rect = document.createElementNS(NS, "rect");
		rect.setAttribute("width", "7");
		rect.setAttribute("height", "7");
		rect.setAttribute("x", r.x);
		rect.setAttribute("y", r.y);
		rect.setAttribute("rx", "1");
		fabIcon.appendChild(rect);
	}
	fab.appendChild(fabIcon);
	shadow.appendChild(fab);

	const panel = document.createElement("div");
	panel.style.cssText = `
		position: absolute;
		right: 0;
		bottom: 60px;
		width: ${PANEL_WIDTH}px;
		height: ${PANEL_HEIGHT}px;
		border-radius: 14px;
		overflow: hidden;
		background: #f8fafc;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
		display: none;
	`;
	shadow.appendChild(panel);

	const appHost = document.createElement("div");
	appHost.style.cssText = "width: 100%; height: 100%;";
	panel.appendChild(appHost);

	setThemeRoot(appHost);
	mount(App, { target: appHost });

	fab.addEventListener("mouseenter", () => {
		fab.style.transform = "scale(1.06)";
	});
	fab.addEventListener("mouseleave", () => {
		fab.style.transform = "scale(1)";
	});

	let open = false;
	function togglePanel() {
		open = !open;
		panel.style.display = open ? "block" : "none";
		fab.style.background = open ? "#1d4ed8" : "#2563eb";
		return open;
	}
	fab.addEventListener("click", togglePanel);

	document.documentElement.appendChild(host);

	return togglePanel;
}

let togglePanel: (() => boolean) | undefined;
try {
	togglePanel = initWidget();
} catch (err) {
	console.warn("[s21-helper] init widget failed:", err);
}

// ---- Горячая клавиша открытия/закрытия панели ------------------------------
let configuredShortcut: string = DEFAULT_SHORTCUT;
let nativeShortcut: string | null | undefined; // undefined = ещё не известен

async function refreshShortcut() {
	try {
		const res = (await chrome.runtime.sendMessage({ type: "shortcut:native" })) as
			{ shortcut?: string | null } | undefined;
		nativeShortcut = res?.shortcut ?? null;
		const stored = await chrome.storage.local.get({ [SHORTCUT_STORAGE_KEY]: DEFAULT_SHORTCUT });
		const v = stored[SHORTCUT_STORAGE_KEY];
		configuredShortcut = typeof v === "string" && v ? v : DEFAULT_SHORTCUT;
	} catch {
		nativeShortcut = null;
	}
}

void refreshShortcut();

chrome.storage?.onChanged?.addListener((changes, area) => {
	if (area === "local" && SHORTCUT_STORAGE_KEY in changes) {
		void refreshShortcut();
	}
});

/** Проверяет, находится ли событие внутри панели расширения (shadow DOM). */
function isInsidePanel(e: KeyboardEvent): boolean {
	return e.composedPath().some((el) => el instanceof Element && el.id === HOST_ID);
}

/** Проверяет, что фокус ввода стоит в текстовом поле / редакторе. */
function isEditableTarget(e: KeyboardEvent): boolean {
	const target = e.composedPath()[0];
	if (!(target instanceof Element)) return false;
	const tag = target.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA") return true;
	return (target as HTMLElement).isContentEditable;
}

/** Одиночная клавиша, которая печатает символ (а не управляющая клавиша). */
function isTypingKey(combo: string): boolean {
	return /^[A-Z0-9]$/.test(combo) || combo === "Space";
}

function onShortcutKeydown(e: KeyboardEvent) {
	if (nativeShortcut === undefined) return;
	if (e.repeat) return;
	if (isInsidePanel(e)) return;
	const combo = eventToShortcut(e);
	if (!combo) return;
	if (combo === nativeShortcut) return; // нативный chrome.commands уже переключает
	if (combo !== configuredShortcut) return;
	// Простое нажатие не должно срабатывать, пока пользователь печатает текст.
	if (!combo.includes("+") && isTypingKey(combo) && isEditableTarget(e)) return;
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
	togglePanel?.();
}

window.addEventListener("keydown", onShortcutKeydown, true);

// По запросу от фона возвращаем текущий логин, найденный на странице платформы.
// И переключаем панель расширения, когда активируется горячая клавиша.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	switch (message?.type) {
		case "login:detect":
			sendResponse({ login: detectCurrentLogin() });
			return true;
		case "panel:toggle":
			sendResponse({ open: togglePanel ? togglePanel() : false });
			return true;
		default:
			return false;
	}
});

// Реальный запрос к API платформы (same-origin) — виден в Network страницы.
// Пробивает сsession по-настоящему и подтверждает, что расширение ходит в API.
if (location.hostname === "platform.21-school.ru") {
	s21Client.campus
		.getCampuses()
		.then((data) => {
			const count = Array.isArray(data) ? data.length : data ? 1 : 0;
			console.log(`[s21-helper] api ok: campuses=${count}`, data);
		})
		.catch((err: unknown) => {
			const status = (err as { status?: number })?.status;
			console.log(`[s21-helper] api error: status=${status}`, err);
		});
}
