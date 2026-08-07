export const S21_PLATFORM_ORIGIN = "https://platform.21-school.ru";

export const S21_API_PATH_PREFIX = "/services/21-school/api";

export const S21_API_BASE_URL = `${S21_PLATFORM_ORIGIN}${S21_API_PATH_PREFIX}`;

/** Маршруты SPA платформы для внешних переходов. */
export const S21_PLATFORM_ROUTES = {
	user: (login: string) => `/user/${encodeURIComponent(login)}`,
	project: (id: number) => `/project/${id}`,
	events: "/",
	event: (id: number) => `/`,
	campusMap: "/campus",
	sales: "/",
} as const;
