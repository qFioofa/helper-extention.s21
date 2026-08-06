<script lang="ts">
	import { onMount } from "svelte";
	import type { CookieInfo } from "../../../infra/chrome/cookies";
	import { logError, logInfo } from "../../../core/logger.svelte";
	import Icon from "../../shared/Icon.svelte";

	const MESSAGE_TIMEOUT_MS = 8000;

	let cookies = $state<CookieInfo[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let copiedName = $state<string | null>(null);

	const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

	function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error("timeout")), ms);
			promise.then(
				(value) => {
					clearTimeout(timer);
					resolve(value);
				},
				(e) => {
					clearTimeout(timer);
					reject(e);
				},
			);
		});
	}

	async function load() {
		if (!isChromeExt) {
			error = "Доступно только внутри расширения";
			return;
		}
		loading = true;
		error = null;
		try {
			const res = await withTimeout(
				chrome.runtime.sendMessage({ type: "cookies:get" }),
				MESSAGE_TIMEOUT_MS,
			);
			if (res?.cookies && Array.isArray(res.cookies)) {
				cookies = res.cookies;
				logInfo(`cookies loaded: ${cookies.length}`, "cookies");
			} else {
				error = res?.error?.message ?? "Пустой ответ от фона";
			}
		} catch {
			error = "Нет ответа от фона (таймаут)";
		}
		loading = false;
	}

	async function copyValue(c: CookieInfo) {
		try {
			await navigator.clipboard.writeText(c.value);
			copiedName = c.name;
			setTimeout(() => (copiedName = null), 1200);
		} catch (e) {
			logError(`copy cookie ${c.name}: ${e}`, "cookies");
		}
	}

	function formatDate(ts?: number) {
		return ts ? new Date(ts * 1000).toLocaleString("ru-RU") : "сессионная";
	}

	onMount(() => {
		void load();
	});
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<span class="text-xs font-semibold">
			Куки платформы: {cookies.length}
		</span>
		<button
			onclick={() => void load()}
			class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
			title="Обновить куки"
		>
			<Icon name="refresh" size={14} class={loading ? "animate-spin" : ""} />
		</button>
	</div>

	{#if error}
		<p class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
			{error}
		</p>
	{:else if cookies.length === 0 && !loading}
		<p class="py-4 text-center text-xs text-slate-400">Куки не найдены. Зайди на платформу.</p>
	{/if}

	<ul class="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
		{#each cookies as c (c.name + c.domain + c.path)}
			<li class="rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-700">
				<div class="flex items-center gap-2">
					<Icon name="cookie" size={13} class="shrink-0 text-amber-500" />
					<span class="min-w-0 flex-1 truncate text-xs font-bold">{c.name}</span>
					{#if c.httpOnly}
						<span
							class="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400"
						>
							httpOnly
						</span>
					{/if}
					{#if c.secure}
						<span
							class="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
						>
							secure
						</span>
					{/if}
				</div>
				<p class="mt-0.5 break-all font-mono text-[10px] text-slate-500 dark:text-slate-400">
					{c.value}
				</p>
				<div class="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-400">
					<span class="truncate">
						{c.domain}{c.path}
					</span>
					<span class="shrink-0 tabular-nums">{formatDate(c.expirationDate)}</span>
					<button
						onclick={() => void copyValue(c)}
						class="shrink-0 rounded px-1.5 py-0.5 font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
						title="Скопировать значение"
					>
						{copiedName === c.name ? "ок" : "копировать"}
					</button>
				</div>
			</li>
		{/each}
	</ul>
</div>