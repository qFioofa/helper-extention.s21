chrome.runtime.onInstalled.addListener(() => {
	console.log("[s21-helper] extension installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message?.type === "PING") {
		sendResponse({ pong: true });
	}
});
