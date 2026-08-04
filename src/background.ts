import { S21Client, S21_API_BASE_URL } from "@s21/api";

// Клиент для фоновых запросов (background/popup). Требует host_permissions в манифесте.
export const s21Client = new S21Client({
	baseUrl: S21_API_BASE_URL,
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
