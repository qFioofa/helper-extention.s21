<script lang="ts">
	const skills = [
		{ name: "C", value: 90 },
		{ name: "Algorithms", value: 72 },
		{ name: "Unix", value: 64 },
		{ name: "Web", value: 38 },
		{ name: "SQL", value: 25 },
	];
</script>

<ul class="flex flex-col gap-2">
	{#each skills as skill (skill.name)}
		<li>
			<div class="mb-1 flex items-center justify-between text-xs">
				<span class="font-medium">{skill.name}</span>
				<span class="tabular-nums text-slate-500 dark:text-slate-400">{skill.value}%</span>
			</div>
			<div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
				<div class="h-full rounded-full bg-blue-600" style="width: {skill.value}%"></div>
			</div>
		</li>
	{/each}
</ul>
