<script lang="ts">
	import { theme, toggleTheme } from "../../../core/stores/theme.svelte";
	import Icon from "../../shared/Icon.svelte";
	import Toggle from "../../shared/Toggle.svelte";

	const toggles = $state([
		{ id: "notify", label: "Уведомления о событиях", enabled: true },
		{ id: "compact", label: "Компактные острова", enabled: false },
	]);

	function flip(id: string) {
		const t = toggles.find((x) => x.id === id);
		if (t) t.enabled = !t.enabled;
	}
</script>

<div class="flex flex-col gap-2">
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
</div>
