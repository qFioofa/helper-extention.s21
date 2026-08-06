<script lang="ts">
	import { theme, toggleTheme } from "../../core/stores/theme.svelte";
	import Icon from "../shared/Icon.svelte";

	const logoUrl =
		typeof chrome !== "undefined" && chrome.runtime?.getURL
			? chrome.runtime.getURL("icons/icon48.png")
			: "/icons/icon48.png";
</script>

<header
	class="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
>
	<img src={logoUrl} alt="logo" class="h-7 w-7 rounded-lg" />
	<div class="min-w-0 flex-1">
		<h1 class="truncate text-sm font-bold leading-tight">Helper S21</h1>
		<p class="text-[10px] leading-tight text-slate-500 dark:text-slate-400">прототип layout</p>
	</div>
	<button
		onclick={toggleTheme}
		class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
		title="Переключить тему"
	>
		<Icon name={theme.mode === "dark" ? "sun" : "moon"} size={16} />
	</button>
</header>
