<script lang="ts">
	import { onMount } from "svelte";
	import {
		clearLogs,
		initLogger,
		logInfo,
		logs,
		type LogLevel,
	} from "../../../core/logger.svelte";
	import Icon from "../../shared/Icon.svelte";

	type Filter = LogLevel | "all";

	let filter = $state<Filter>("all");

	const LEVEL_BADGE: Record<LogLevel, string> = {
		debug: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
		info: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
		warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
		error: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
	};

	const FILTERS: { id: Filter; label: string }[] = [
		{ id: "all", label: "Все" },
		{ id: "debug", label: "Отл." },
		{ id: "info", label: "Инфо" },
		{ id: "warn", label: "Пред." },
		{ id: "error", label: "Ошибки" },
	];

	const visible = $derived(filter === "all" ? logs : logs.filter((e) => e.level === filter));

	onMount(() => {
		initLogger();
	});

	function formatTime(ts: number) {
		const d = new Date(ts);
		const time = d.toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		if (d.toDateString() === new Date().toDateString()) return time;
		return `${d.toLocaleDateString("ru-RU")} ${time}`;
	}

	function formatData(data: unknown) {
		if (data === undefined) return "";
		try {
			return JSON.stringify(data, null, 2);
		} catch {
			return String(data);
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-wrap gap-1">
			{#each FILTERS as f (f.id)}
				<button
					onclick={() => (filter = f.id)}
					class="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors {filter ===
					f.id
						? 'bg-blue-600 text-white'
						: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}"
				>
					{f.label}
				</button>
			{/each}
		</div>
		<div class="flex shrink-0 gap-1">
			<button
				onclick={() => logInfo("тестовая запись лога", "logs")}
				class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
				title="Записать тестовый лог"
			>
				<Icon name="terminal" size={14} />
			</button>
			<button
				onclick={clearLogs}
				class="rounded-md p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
				title="Очистить логи"
			>
				<Icon name="refresh" size={14} />
			</button>
		</div>
	</div>

	{#if visible.length === 0}
		<p class="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
			Логов пока нет. Записи появляются здесь по мере работы расширения.
		</p>
	{:else}
		<ul class="flex max-h-72 flex-col gap-1 overflow-y-auto">
			{#each visible as entry (entry.id)}
				<li
					class="flex flex-col gap-0.5 rounded-md border border-slate-200 px-2 py-1.5 dark:border-slate-700"
				>
					<div class="flex items-center gap-2">
						<span
							class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase {LEVEL_BADGE[
								entry.level
							]}"
						>
							{entry.level}
						</span>
						<span class="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
							{formatTime(entry.ts)}
						</span>
						<span
							class="shrink-0 text-[10px] font-semibold text-blue-600 dark:text-blue-400"
						>
							{entry.source}
						</span>
					</div>
					<p class="break-all text-xs text-slate-700 dark:text-slate-300">
						{entry.message}
					</p>
					{#if entry.data !== undefined}
						<pre
							class="mt-1 break-all rounded bg-slate-100 p-1.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{formatData(
								entry.data,
							)}</pre>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
