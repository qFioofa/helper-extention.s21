import { S21_API_BASE_URL } from "@s21/api";
import { getAccessToken } from "../infra/chrome/token";
import { backgroundClient } from "./client";

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
		if (res.ok) return "authorized";
		if (res.status === 401 || res.status === 403) return "unauthorized";
		return "offline";
	} catch {
		return "offline";
	} finally {
		clearTimeout(timer);
	}
}