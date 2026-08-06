<script lang="ts">
	const events = [
		{ title: "Piscine rush · sprint", date: "12 авг, 19:00", place: "Казань · кластер А" },
		{ title: "Выступление: дизайн", date: "14 авг, 18:00", place: "онлайн" },
		{ title: "Местная лекция: C2", date: "18 авг, 17:30", place: "Казань · аудитория 302" },
	];
</script>

<ul class="flex flex-col gap-2.5">
	{#each events as e (e.title)}
		<li>
			<p class="text-sm font-semibold">{e.title}</p>
			<p class="text-xs text-slate-500 dark:text-slate-400">
				{e.date} · {e.place}
			</p>
		</li>
	{/each}
</ul>
