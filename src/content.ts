import { mount } from "svelte";
import { S21Client, S21_API_PATH_PREFIX } from "@s21/api";
import App from "./App.svelte";
import { setThemeRoot } from "./core/stores/theme.svelte";
import appCss from "./app.css?inline";

// В контексте страницы платформы запросы идут same-origin с сессионными куками.
export const s21Client = new S21Client({
	baseUrl: `${location.origin}${S21_API_PATH_PREFIX}`,
});

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
	fab.innerHTML = `
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
			stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<rect width="7" height="7" x="3" y="3" rx="1"/>
			<rect width="7" height="7" x="14" y="3" rx="1"/>
			<rect width="7" height="7" x="14" y="14" rx="1"/>
			<rect width="7" height="7" x="3" y="14" rx="1"/>
		</svg>`;
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
	fab.addEventListener("click", () => {
		open = !open;
		panel.style.display = open ? "block" : "none";
		fab.style.background = open ? "#1d4ed8" : "#2563eb";
	});

	document.documentElement.appendChild(host);
}

initWidget();

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
