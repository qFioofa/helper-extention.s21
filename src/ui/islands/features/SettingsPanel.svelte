<script lang="ts">
	import { onMount } from "svelte";
	import { theme, toggleTheme } from "../../../core/stores/theme.svelte";
	import { eventToShortcut, isValidShortcut } from "../../../core/keybinding";
	import {
		DEFAULT_SHORTCUT,
		getConfiguredShortcut,
		openShortcutSettings,
		setConfiguredShortcut,
	} from "../../../infra/chrome/commands";
	import Icon from "../../shared/Icon.svelte";
	import Toggle from "../../shared/Toggle.svelte";

	type Tab = "general" | "shortcuts";

	let tab = $state<Tab>("general");

	const toggles = $state([
		{ id: "notify", label: "Уведомления о событиях", enabled: true },
		{ id: "compact", label: "Компактные острова", enabled: false },
	]);

	function flip(id: string) {
		const t = toggles.find((x) => x.id === id);
		if (t) t.enabled = !t.enabled;
	}

	let shortcut = $state(DEFAULT_SHORTCUT);
	let shortcutLoaded = $state(false);
	let recording = $state(false);
	let status = $state<{ ok: boolean; text: string } | null>(null);

	function loadShortcut() {
		getConfiguredShortcut().then((s) => {
			if (s) shortcut = s;
			shortcutLoaded = true;
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!recording) return;
		e.preventDefault();
		e.stopPropagation();
		if (e.key === "Escape") {
			recording = false;
			return;
		}
		const combo = eventToShortcut(e);
		if (!combo) return;
		recording = false;
		void applyShortcut(combo);
	}

	onMount(() => {
		loadShortcut();
		window.addEventListener("keydown", handleKeydown, true);
		return () => window.removeEventListener("keydown", handleKeydown, true);
	});

	function startRecording() {
		recording = true;
		status = null;
	}

	async function applyShortcut(combo: string) {
		if (!isValidShortcut(combo)) {
			status = { ok: false, text: "Недопустимая комбинация" };
			return;
		}
		const res = await setConfiguredShortcut(combo);
		if (res.ok) {
			shortcut = combo;
			status = { ok: true, text: "Сочетание сохранено" };
		} else {
			status = { ok: false, text: res.error ?? "Не удалось сохранить" };
		}
	}

	function resetShortcut() {
		void applyShortcut(DEFAULT_SHORTCUT);
	}

	function openBrowserSettings() {
		void openShortcutSettings();
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
		<button
			onclick={() => (tab = "general")}
			class="flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors {tab ===
			'general'
				? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
				: 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
		>
			Общие
		</button>
		<button
			onclick={() => (tab = "shortcuts")}
			class="flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors {tab ===
			'shortcuts'
				? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
				: 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
		>
			<Icon name="keyboard" size={13} />
			Горячие клавиши
		</button>
	</div>

	{#if tab === "general"}
		<button
			onclick={toggleTheme}
			class="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
		>
			<span class="flex items-center gap-2">
				<Icon name={theme.mode === "dark" ? "sun" : "moon"} size={15} />
				Тёмная тема
			</span>
			<Toggle checked={theme.mode === "dark"} />
		</button>

		{#each toggles as t (t.id)}
			<button
				onclick={() => flip(t.id)}
				class="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
			>
				<span>{t.label}</span>
				<Toggle checked={t.enabled} />
			</button>
		{/each}
	{:else}
		<div class="flex flex-col gap-2">
			<div class="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
				<div class="flex items-start justify-between gap-2">
					<p class="text-sm font-semibold">Открыть / закрыть окно расширения</p>
					<kbd
						class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:border-slate-600 dark:bg-slate-800"
					>
						{shortcutLoaded ? shortcut : "…"}
					</kbd>
				</div>
				<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
					Сочетание клавиш, показывающее и скрывающее окно расширения. Можно задать
					комбинацию с модификаторами или одиночную клавишу.
				</p>

				<div class="mt-2 flex items-center gap-2">
					{#if recording}
						<span class="text-xs text-blue-600 dark:text-blue-400">
							Нажмите комбинацию или одиночную клавишу… (Esc — отмена)
						</span>
					{:else}
						<button
							onclick={startRecording}
							class="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
						>
							Записать
						</button>
						<button
							onclick={resetShortcut}
							class="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
						>
							Сбросить
						</button>
					{/if}
				</div>

				{#if status}
					<p
						class="mt-2 text-xs {status.ok
							? 'text-green-600 dark:text-green-400'
							: 'text-red-500 dark:text-red-400'}"
					>
						{status.text}
					</p>
				{/if}
			</div>

			<button
				onclick={openBrowserSettings}
				class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
			>
				Открыть настройки сочетаний браузера
			</button>
			<p class="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
				Сочетание также можно изменить вручную в chrome://extensions/shortcuts либо
				about:addons → Управление сочетаниями.
			</p>
		</div>
	{/if}
</div>
