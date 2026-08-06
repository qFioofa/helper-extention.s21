<script lang="ts">
	const mockUser = {
		login: "qFioofa",
		campus: "Казань",
		coalition: "Мандариновый",
		xp: 182_450,
		level: 4.21,
	};
</script>

<div class="flex items-center gap-3">
	<div
		class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white"
	>
		{mockUser.login[0].toUpperCase()}
	</div>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-bold">{mockUser.login}</p>
		<p class="text-xs text-slate-500 dark:text-slate-400">Коалиция · {mockUser.coalition}</p>
		<p class="text-xs text-slate-500 dark:text-slate-400">Кампус · {mockUser.campus}</p>
	</div>
	<div class="text-right">
		<p class="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
			{mockUser.level}
		</p>
		<p class="text-[10px] text-slate-400">уровень</p>
	</div>
</div>
