import { S21_API_BASE_URL } from "@qfioofa/s21-api";
import { getAccessToken } from "../infra/chrome/token";
import { backgroundClient } from "./client";
import { logDebug, logWarn } from "../core/logger.svelte";

export type AuthStatus = "unknown" | "authorized" | "unauthorized" | "offline";

export { backgroundClient };

const PROBE_TIMEOUT_MS = 10_000;
const PROBE_PATH = "/v1/campuses";

/**
 * Проверяет авторизацию: сначала Bearer-токен (если есть), иначе по кукам.
 */
export async function probeAuth(): Promise<AuthStatus> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
	try {
		const token = await getAccessToken();
		const res = await fetch(`${S21_API_BASE_URL}${PROBE_PATH}`, {
			credentials: "include",
			signal: controller.signal,
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		if (res.ok) {
			logDebug("auth probe ok", "auth", { status: res.status, token: !!token });
			return "authorized";
		}
		if (res.status === 401 || res.status === 403) {
			logWarn("auth probe denied", "auth", { status: res.status, token: !!token });
			return "unauthorized";
		}
		logWarn("auth probe offline", "auth", { status: res.status, token: !!token });
		return "offline";
	} catch (err) {
		logWarn("auth probe failed", "auth", { error: String(err) });
		return "offline";
	} finally {
		clearTimeout(timer);
	}
}
