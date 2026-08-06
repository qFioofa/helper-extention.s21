<script lang="ts">
	import type { IslandDef } from "../../core/registry";
	import Icon from "../shared/Icon.svelte";

	let { island }: { island: IslandDef } = $props();

	const Component = $derived(island.component);
	let refreshing = $state(false);

	function refresh() {
		refreshing = true;
		setTimeout(() => (refreshing = false), 600);
	}
</script>

<section
	class="relative rounded-xl border border-slate-300 bg-white pt-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
>
	<h3
		class="absolute -top-2.5 left-3 max-w-[calc(100%-3.5rem)] truncate rounded-md bg-white px-1.5 text-xs font-semibold text-blue-600 dark:bg-slate-900 dark:text-blue-400"
	>
		{island.title}
	</h3>

	<div class="px-3 pb-3 pt-1">
		<Component />
	</div>

	<button
		onclick={refresh}
		class="absolute -top-2.5 right-2 rounded-lg bg-white p-1 text-slate-400 shadow-sm hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200"
		title="Обновить"
	>
		<Icon name="refresh" size={14} class={refreshing ? "animate-spin" : ""} />
	</button>
</section>
