import { S21Client } from "@s21/api";

// В контексте страницы платформы запросы идут same-origin с сессионными куками.
export const s21Client = new S21Client({
	baseUrl: location.origin,
});

const container = document.createElement("div");
container.id = "s21-helper-demo";
container.textContent = "Hello from s21 helper";
container.style.cssText = `
	position: fixed;
	bottom: 16px;
	right: 16px;
	z-index: 999999;
	padding: 8px 12px;
	border-radius: 8px;
	background: #2563eb;
	color: #ffffff;
	font: 13px/1.4 system-ui, sans-serif;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;
document.body.appendChild(container);
