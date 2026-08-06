<script lang="ts">
	const xp = 182_450;
	const max = 240_000;
	const percent = Math.round((xp / max) * 100);
</script>

<div class="flex items-center justify-between">
	<p class="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
		{xp.toLocaleString("ru-RU")}
	</p>
	<span class="text-xs text-slate-500 dark:text-slate-400">XP</span>
</div>
<div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
	<div class="h-full rounded-full bg-blue-600" style="width: {percent}%"></div>
</div>
<p class="mt-1 text-[10px] text-slate-400">до {max.toLocaleString("ru-RU")} XP · {percent}%</p>
