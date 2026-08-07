<script lang="ts">
	import { onMount } from "svelte";
	import { logError } from "../../../core/logger.svelte";
	import type { SaleV1DTO } from "@s21/api";

	const MESSAGE_TIMEOUT_MS = 20_000;

	type State =
		| { kind: "loading" }
		| { kind: "error"; message: string }
		| { kind: "done"; sales: SaleV1DTO[] };

	const TYPE_LABEL: Record<string, string> = { PRP: "Peer Review Points", CRP: "Code Review Points" };
	const STATUS_LABEL: Record<string, string> = {
		ACTIVE: "Активна",
		PLANNED: "Планируется",
		NON_ACTIVE: "Не активна",
	};
	const STATUS_COLOR: Record<string, string> = {
		ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
		PLANNED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
		NON_ACTIVE: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
	};

	let viewState = $state<State>({ kind: "loading" });

	const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

	function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error("timeout")), ms);
			promise.then(
				(v) => {
					clearTimeout(timer);
					resolve(v);
				},
				(e) => {
					clearTimeout(timer);
					reject(e);
				},
			);
		});
	}

	function formatError(err: unknown): string {
		if (err && typeof err === "object") {
			const e = err as { status?: number; message?: string };
			if (typeof e.status === "number") return `HTTP ${e.status}`;
			if (e.message) return e.message;
		}
		return String(err);
	}

	async function load() {
		if (!isChromeExt) {
			viewState = { kind: "error", message: "Доступно только внутри расширения" };
			return;
		}
		viewState = { kind: "loading" };
		try {
			const res = await withTimeout(
				chrome.runtime.sendMessage({ type: "api:sales" }),
				MESSAGE_TIMEOUT_MS,
			);
			if (res?.data) {
				viewState = { kind: "done", sales: res.data.sales ?? [] };
			} else if (res?.error) {
				viewState = { kind: "error", message: formatError(res.error) };
			} else {
				viewState = { kind: "error", message: "Пустой ответ от фона" };
			}
		} catch {
			viewState = { kind: "error", message: "Нет ответа от фона (таймаут)" };
			logError("sales: timeout", "sales");
		}
	}

	onMount(() => {
		void load();
	});
</script>

{#if viewState.kind === "loading"}
	<p class="animate-pulse text-xs text-slate-400">Загружаем статус sales…</p>
{:else if viewState.kind === "error"}
	<p
		class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
	>
		{viewState.message}
	</p>
{:else if viewState.sales.length === 0}
	<p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50">
		Нет данных о sales.
	</p>
{:else}
	<ul class="flex flex-col gap-1.5">
		{#each viewState.sales as s (s.type + s.status)}
			<li
				class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-700"
			>
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold">{TYPE_LABEL[s.type] ?? s.type}</p>
					{#if s.startDateTime}
						<p class="truncate text-[10px] text-slate-400">
							нач. {new Date(s.startDateTime).toLocaleString("ru-RU")}
						</p>
					{/if}
				</div>
				<div class="flex shrink-0 flex-col items-end gap-1">
					<span
						class="rounded-full px-2 py-0.5 text-[10px] font-semibold {STATUS_COLOR[s.status] ?? STATUS_COLOR.NON_ACTIVE}"
					>
						{STATUS_LABEL[s.status] ?? s.status}
					</span>
					{#if typeof s.progressPercentage === "number"}
						<span class="text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
							{s.progressPercentage}%
						</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}