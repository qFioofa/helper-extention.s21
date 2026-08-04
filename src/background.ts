import { S21Client } from "@s21/api";

const S21_PLATFORM_ORIGIN = "https://21-school.ru"; // TODO: подтвердить актуальный домен платформы

// Клиент для фоновых запросов (background/popup). Требует host_permissions в манифесте.
export const s21Client = new S21Client({
	baseUrl: S21_PLATFORM_ORIGIN,
	credentials: "include",
});

chrome.runtime.onInstalled.addListener(() => {
	console.log("[s21-helper] extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message?.type === "PING") {
		sendResponse({ pong: true });
	}
});
