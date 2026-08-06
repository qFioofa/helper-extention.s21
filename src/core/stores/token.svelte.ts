import { TOKEN_STORAGE_KEY } from "../../infra/chrome/token";

export const token = $state<{ value: string | null; loading: boolean }>({
	value: null,
	loading: false,
});

const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

let initialized = false;

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

export async function refreshTokenValue() {
	if (!isChromeExt) {
		token.value = null;
		return;
	}
	try {
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type: "token:get" }),
			4000,
		);
		token.value = typeof res?.token === "string" && res.token.length > 0 ? res.token : null;
	} catch {
		token.value = null;
	}
}

export function initTokenStore() {
	if (initialized) return;
	initialized = true;
	if (isChromeExt && chrome.storage?.onChanged) {
		chrome.storage.onChanged.addListener((changes, area) => {
			if (area !== "local" || !changes[TOKEN_STORAGE_KEY]) return;
			const v = changes[TOKEN_STORAGE_KEY].newValue;
			if (v && typeof v === "object") {
				const access = (v as { access_token?: unknown }).access_token;
				token.value = typeof access === "string" && access.length > 0 ? access : null;
			} else {
				token.value = null;
			}
		});
	}
	void refreshTokenValue();
}

export function resetToken() {
	if (!isChromeExt) {
		token.value = null;
		return;
	}
	void chrome.runtime
		.sendMessage({ type: "token:clear" })
		.then(() => {
			token.value = null;
		})
		.catch(() => {
			token.value = null;
		});
}
