export interface CookieInfo {
	name: string;
	value: string;
	domain: string;
	path: string;
	secure: boolean;
	httpOnly: boolean;
	session: boolean;
	expirationDate?: number;
	sameSite?: chrome.cookies.SameSiteStatus;
}

const DOMAINS = ["21-school.ru", "platform.21-school.ru", "auth.21-school.ru"];

/** Читает все куки доменов платформы/auth (без дублей по name@domain+path). */
export async function getCookies(): Promise<CookieInfo[]> {
	const all: CookieInfo[] = [];
	const seen = new Set<string>();
	for (const domain of DOMAINS) {
		const cookies = await chrome.cookies.getAll({ domain });
		for (const c of cookies) {
			const key = `${c.name}@${c.domain}${c.path}`;
			if (seen.has(key)) continue;
			seen.add(key);
			all.push({
				name: c.name,
				value: c.value,
				domain: c.domain,
				path: c.path,
				secure: c.secure ?? false,
				httpOnly: c.httpOnly ?? false,
				session: !c.expirationDate,
				expirationDate: c.expirationDate,
				sameSite: c.sameSite,
			});
		}
	}
	return all;
}

const TOKEN_ISH = /(token|jwt|session|sid|auth|access|key)/i;

/** Ищет наиболее вероятную куку-токен (по имени и длине значения). */
export function findTokenCookie(cookies: CookieInfo[]): CookieInfo | null {
	const candidates = cookies.filter((c) => TOKEN_ISH.test(c.name) && c.value.length > 10);
	candidates.sort((a, b) => b.value.length - a.value.length);
	return candidates[0] ?? null;
}