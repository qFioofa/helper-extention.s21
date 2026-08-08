const MODIFIERS = ["Ctrl", "Alt", "Shift", "Command", "MacCtrl"] as const;

const KEY_ALIASES: Record<string, string> = {
	" ": "Space",
	",": "Comma",
	".": "Period",
	ARROWUP: "Up",
	ARROWDOWN: "Down",
	ARROWLEFT: "Left",
	ARROWRIGHT: "Right",
	Home: "Home",
	End: "End",
	PageUp: "PageUp",
	PageDown: "PageDown",
	Insert: "Insert",
	Delete: "Delete",
};

const FUNCTION_KEYS = /^F(?:[1-9]|1[0-2])$/;
const MEDIA_KEYS = ["MediaNextTrack", "MediaPlayPause", "MediaPrevTrack", "MediaStop"];

const PLAIN_KEYS = new Set([
	"Comma",
	"Period",
	"Home",
	"End",
	"PageUp",
	"PageDown",
	"Space",
	"Insert",
	"Delete",
	"Up",
	"Down",
	"Left",
	"Right",
]);

function normalizedKey(key: string): string | null {
	if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta") return null;
	const upper = key.toUpperCase();
	if (/^[A-Z0-9]$/.test(upper)) return upper;
	if (FUNCTION_KEYS.test(upper)) return upper;
	return key in KEY_ALIASES ? KEY_ALIASES[key] : null;
}

/** Превращает нажатие клавиатуры в комбинацию в формате "Ctrl+M". */
export function eventToShortcut(e: KeyboardEvent): string | null {
	const key = normalizedKey(e.key);
	if (!key) return null;
	const parts: string[] = [];
	if (e.ctrlKey) parts.push("Ctrl");
	if (e.altKey) parts.push("Alt");
	if (e.shiftKey) parts.push("Shift");
	if (e.metaKey) parts.push("Command");
	parts.push(key);
	return parts.join("+");
}

/** Проверяет корректность комбинации для chrome.commands. */
export function isValidShortcut(shortcut: string): boolean {
	const parts = shortcut.split("+");
	if (parts.length < 1 || parts.length > 3) return false;
	const mods = parts.slice(0, -1);
	const key = parts[parts.length - 1];

	const isFunctionKey = FUNCTION_KEYS.test(key);
	const isMediaKey = MEDIA_KEYS.includes(key);
	if (!isFunctionKey && !isMediaKey && !PLAIN_KEYS.has(key) && !/^[A-Z0-9]$/.test(key)) {
		return false;
	}

	// Простое нажатие — одиночная клавиша без модификаторов.
	if (mods.length === 0) return true;

	if (!mods.every((m) => (MODIFIERS as readonly string[]).includes(m))) return false;
	if (new Set(mods).size !== mods.length) return false;
	if (mods.includes("Ctrl") && mods.includes("MacCtrl")) return false;
	if (mods.includes("MacCtrl") && mods.includes("Command")) return false;
	return true;
}
