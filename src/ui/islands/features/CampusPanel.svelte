<script lang="ts">
	const clusters = [
		{ id: "A", free: 12, total: 40 },
		{ id: "B", free: 3, total: 40 },
		{ id: "C", free: 27, total: 40 },
	];
</script>

<div class="grid grid-cols-3 gap-2">
	{#each clusters as c (c.id)}
		<div
			class="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center dark:border-slate-700 dark:bg-slate-800"
		>
			<p class="text-sm font-bold text-blue-600 dark:text-blue-400">Кластер {c.id}</p>
			<p class="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
				{c.free} / {c.total} мест
			</p>
		</div>
	{/each}
</div>
