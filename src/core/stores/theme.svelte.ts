const STORAGE_KEY = "s21-helper:theme";

type Theme = "light" | "dark";

function initialTheme(): Theme {
	if (typeof localStorage !== "undefined") {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === "light" || saved === "dark") return saved;
	}
	if (
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	) {
		return "dark";
	}
	return "light";
}

export const theme = $state({ mode: initialTheme() as Theme });

let themeRoot: HTMLElement | null =
	typeof document !== "undefined" ? document.documentElement : null;

export function setThemeRoot(el: HTMLElement | null) {
	themeRoot = el;
	applyTheme();
}

export function toggleTheme() {
	theme.mode = theme.mode === "dark" ? "light" : "dark";
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(STORAGE_KEY, theme.mode);
	}
	applyTheme();
}

export function applyTheme() {
	themeRoot?.classList.toggle("dark", theme.mode === "dark");
}
