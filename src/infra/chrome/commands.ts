export const TOGGLE_PANEL_COMMAND = "toggle-helper-panel";
export const DEFAULT_SHORTCUT = "Ctrl+M";
export const SHORTCUT_STORAGE_KEY = "helperShortcut";

const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

type ShortcutResult = { ok: boolean; error?: string };

interface CommandsNamespace {
	update?: (options: { name: string; shortcut?: string }) => Promise<void>;
	openShortcutSettings?: () => Promise<void>;
}

/** Текущее активное нативное сочетание команды (задаётся в chrome://extensions/shortcuts). */
export async function getPopupShortcut(): Promise<string | null> {
	if (!isChromeExt || typeof chrome.commands?.getAll !== "function") return null;
	try {
		const commands = await chrome.commands.getAll();
		const cmd = commands.find((c) => c.name === TOGGLE_PANEL_COMMAND);
		const shortcut = cmd?.shortcut?.trim();
		return shortcut ? shortcut : null;
	} catch {
		return null;
	}
}

/** Сохранённое пользователем сочетание (chrome.storage), по умолчанию Ctrl+M. */
export async function getConfiguredShortcut(): Promise<string> {
	if (!isChromeExt) return DEFAULT_SHORTCUT;
	try {
		const data = await chrome.storage.local.get({ [SHORTCUT_STORAGE_KEY]: DEFAULT_SHORTCUT });
		const v = data[SHORTCUT_STORAGE_KEY];
		return typeof v === "string" && v ? v : DEFAULT_SHORTCUT;
	} catch {
		return DEFAULT_SHORTCUT;
	}
}

/**
 * Сохраняет сочетание в chrome.storage — работает во всех браузерах.
 * В Firefox дополнительно пробует обновить нативный chrome.commands.
 */
export async function setConfiguredShortcut(shortcut: string): Promise<ShortcutResult> {
	if (!isChromeExt) return { ok: false, error: "unsupported" };
	try {
		await chrome.storage.local.set({ [SHORTCUT_STORAGE_KEY]: shortcut });
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : String(err) };
	}
	const commands = chrome as unknown as { commands?: CommandsNamespace };
	if (typeof commands.commands?.update === "function") {
		try {
			await commands.commands.update({ name: TOGGLE_PANEL_COMMAND, shortcut });
		} catch {
			/* нативный бинд не обновляется — достаточно chrome.storage */
		}
	}
	return { ok: true };
}

/** Открывает встроенную страницу/панель управления сочетаниями браузера. */
export async function openShortcutSettings(): Promise<boolean> {
	if (!isChromeExt) return false;
	const commands = (chrome as unknown as { commands?: CommandsNamespace }).commands;
	if (typeof commands?.openShortcutSettings === "function") {
		try {
			await commands.openShortcutSettings();
			return true;
		} catch {
			/* переходим к fallback ниже */
		}
	}
	try {
		await chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
		return true;
	} catch {
		try {
			await chrome.tabs.create({ url: "about:addons" });
			return true;
		} catch {
			return false;
		}
	}
}
