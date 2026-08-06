<script lang="ts">
	import { categories } from "../../core/registry";
	import { activeCategoryId, selectCategory } from "../../core/stores/category.svelte";
	import Icon from "../shared/Icon.svelte";

	let collapsed = $state(false);
</script>

<nav
	class="absolute inset-y-0 left-0 z-20 flex flex-col gap-1 overflow-y-auto border-r border-slate-200 bg-white p-2 transition-[width,box-shadow] duration-150 dark:border-slate-800 dark:bg-slate-900 {collapsed
		? 'w-12'
		: 'w-44 shadow-2xl'}"
>
	{#each categories as cat (cat.id)}
		<button
			onclick={() => selectCategory(cat.id)}
			class="flex shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors {activeCategoryId.value ===
			cat.id
				? 'bg-blue-600 text-white shadow-sm'
				: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
			title={cat.title}
		>
			<Icon name={cat.icon} size={18} class="shrink-0" />
			{#if !collapsed}
				<span class="truncate">{cat.title}</span>
			{/if}
		</button>
	{/each}

	<div class="mt-auto border-t border-slate-200 pt-1 dark:border-slate-800">
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
			title={collapsed ? "Развернуть" : "Свернуть"}
		>
			<Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={16} />
		</button>
	</div>
</nav>
