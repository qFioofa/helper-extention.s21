<script lang="ts">
	import Icon from "../../shared/Icon.svelte";

	let query = $state("");

	const found = $derived(
		query.trim()
			? {
					login: query.trim().toLowerCase(),
					coalition: "Мандариновый",
					xp: 96_120,
					level: 2.8,
				}
			: null,
	);
</script>

<div class="relative">
	<Icon
		name="search"
		size={14}
		class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
	/>
	<input
		bind:value={query}
		type="text"
		placeholder="Логин участника…"
		class="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
	/>
</div>

{#if found}
	<div
		class="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-sm font-bold text-white"
			>
				{found.login[0].toUpperCase()}
			</div>
			<div>
				<p class="text-sm font-semibold">{found.login}</p>
				<p class="text-[10px] text-slate-500 dark:text-slate-400">{found.coalition}</p>
			</div>
		</div>
		<div class="text-right">
			<p class="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
				{found.xp.toLocaleString("ru-RU")}
			</p>
			<p class="text-[10px] text-slate-400">XP · ур. {found.level}</p>
		</div>
	</div>
{/if}
