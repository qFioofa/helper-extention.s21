<script lang="ts">
	const projects = [
		{ name: "s21_docker", status: "in_progress", mark: null },
		{ name: "s21_celery", status: "in_progress", mark: null },
		{ name: "s21_matrix", status: "done", mark: 103 },
		{ name: "s21_string", status: "done", mark: 90 },
	];
</script>

<ul class="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
	{#each projects as p (p.name)}
		<li class="flex items-center justify-between py-1.5">
			<span class="truncate text-sm font-mono">{p.name}</span>
			{#if p.status === "in_progress"}
				<span
					class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
				>
					в работе
				</span>
			{:else}
				<span
					class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
				>
					{p.mark}%
				</span>
			{/if}
		</li>
	{/each}
</ul>
