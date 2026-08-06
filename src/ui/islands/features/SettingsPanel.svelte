<script lang="ts">
	import { theme, toggleTheme } from "../../../core/stores/theme.svelte";
	import Icon from "../../shared/Icon.svelte";

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
		<span
			class="relative h-5 w-9 rounded-full transition-colors {theme.mode === 'dark'
				? 'bg-blue-600'
				: 'bg-slate-300'}"
		>
			<span
				class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {theme.mode ===
				'dark'
					? 'translate-x-[18px]'
					: 'translate-x-0.5'}"
			></span>
		</span>
	</button>

	{#each toggles as t (t.id)}
		<button
			onclick={() => flip(t.id)}
			class="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
		>
			<span>{t.label}</span>
			<span
				class="relative h-5 w-9 rounded-full transition-colors {t.enabled
					? 'bg-blue-600'
					: 'bg-slate-300'}"
			>
				<span
					class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {t.enabled
						? 'translate-x-[18px]'
						: 'translate-x-0.5'}"
				></span>
			</span>
		</button>
	{/each}
</div>
