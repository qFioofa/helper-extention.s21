<script lang="ts">
	import { onMount } from "svelte";
	import Icon from "../../shared/Icon.svelte";
	import { logError, logInfo, logWarn } from "../../../core/logger.svelte";
	import ProjectParticipantCard from "./ProjectParticipantCard.svelte";
	import {
		projectSearch,
		getCategory,
		ensureCategory,
		loadStatusStat,
		populateStatus,
		loadMoreStatus,
	} from "../../../core/stores/projectSearch.svelte";

	let { status, label, dotClass } = $props();

	const MESSAGE_TIMEOUT_MS = 25_000;
	const PAGE = 50;
	const CONCURRENCY = 4;

	const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

	function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error("timeout")), ms);
			promise.then(
				(value) => {
					clearTimeout(timer);
					resolve(value);
				},
				(error) => {
					clearTimeout(timer);
					reject(error);
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

	async function send<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
		if (!isChromeExt) throw new Error("Доступно только внутри расширения");
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type, ...payload }),
			MESSAGE_TIMEOUT_MS,
		);
		if (res?.error) throw res.error;
		return res?.data as T;
	}

	// Категория из глобального состояния
	const cat = $derived(getCategory(status));

	// Загружаем статистику при монтировании, если категория развёрнута
	// или если она свёрнута, но это первая загрузка (для счётчика в шапке).
	onMount(async () => {
		if (!cat) return;
		if (!cat.statLoaded) {
			void loadStatusStat(status);
		}
		if (cat.expanded && !cat.participants.length) {
			void populateStatus(status);
		}
	});

	function toggle() {
		if (!cat) return;
		cat.expanded = !cat.expanded;
		if (cat.expanded) {
			if (!cat.statLoaded) void loadStatusStat(status);
			void populateStatus(status);
		}
	}

	async function loadMore() {
		if (!cat || !cat.hasMore || cat.loadingLogins || cat.loadingDetails) return;
		void loadMoreStatus(status);
	}

	function hasParticipants() {
		return cat?.participants.some((p) => p != null) ?? false;
	}
</script>

<div class="flex flex-col gap-1.5">
	<!-- Шапка категории -->
	{#if !cat}
		<p class="text-xs text-slate-400">Категория не найдена</p>
	{:else}
		<button
			onclick={toggle}
			class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-500"
		>
			<div class="flex items-center gap-1.5">
				<span class="h-2 w-2 shrink-0 rounded-full {cat.dotClass}"></span>
				<span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{cat.label}</span>
			</div>
			<div class="flex items-center gap-1.5">
				{#if cat.loadingLogins}
					<span class="animate-pulse text-[10px] text-slate-400">загрузка…</span>
				{:else if cat.error}
					<span class="text-[10px] text-rose-500 dark:text-rose-400">{cat.error}</span>
				{:else if cat.logins.length > 0}
					<span class="text-[10px] text-slate-500 dark:text-slate-400">
						{cat.logins.length}
						{#if cat.hasMore}+{/if}
					</span>
				{:else}
					<span class="text-[10px] text-slate-400">0</span>
				{/if}
				<Icon
					name={cat.expanded ? "chevronUp" : "chevronDown"}
					size={12}
					class="text-slate-400 dark:text-slate-500"
				/>
			</div>
		</button>

		<!-- Список участников -->
		{#if cat.expanded}
			<div class="flex flex-col gap-1.5">
				{#if cat.loadingLogins && !cat.logins.length}
					<p class="animate-pulse text-xs text-slate-400">Загружаем участников…</p>
				{:else if cat.error && !cat.logins.length}
					<p class="text-xs text-rose-500 dark:text-rose-400">{cat.error}</p>
				{:else if !cat.logins.length}
					<p class="text-xs text-slate-400">Нет участников</p>
				{:else}
					{#each cat.participants as p (p?.login)}
						{#if p}
							<ProjectParticipantCard login={p.login} participant={p} />
						{:else}
							<p class="text-xs text-slate-400">Не удалось загрузить данные</p>
						{/if}
					{/each}
					{#if cat.hasMore}
						<button
							onclick={loadMore}
							disabled={cat.loadingLogins || cat.loadingDetails}
							class="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
						>
							{#if cat.loadingLogins || cat.loadingDetails}
								<span class="animate-pulse">Загружаем ещё…</span>
							{:else}
								<span>Загрузить ещё</span>
							{/if}
						</button>
					{/if}
				{/if}
			</div>
		{/if}
	{/if}
</div>
