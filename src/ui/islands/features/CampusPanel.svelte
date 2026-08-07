<script lang="ts">
	import { onMount } from "svelte";
	import { logError } from "../../../core/logger.svelte";
	import type { CampusV1DTO, ClusterV1DTO } from "@s21/api";

	const MESSAGE_TIMEOUT_MS = 20_000;

	type State =
		| { kind: "loading" }
		| { kind: "error"; message: string }
		| { kind: "clusters"; campuses: CampusV1DTO[]; clusters: ClusterV1DTO[] };

	let campusId = $state("");
	let clusterLoading = $state(false);
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

	function campusName(c: CampusV1DTO): string {
		return c.shortName || c.fullName;
	}

	/** Сортировка: сначала кампусы c «21», затем по алфавиту. */
	function sortCampuses(list: CampusV1DTO[]): CampusV1DTO[] {
		return [...list].sort((a, b) => {
			const a21 = /21/i.test(campusName(a)) ? 1 : 0;
			const b21 = /21/i.test(campusName(b)) ? 1 : 0;
			if (a21 !== b21) return b21 - a21;
			return campusName(a).localeCompare(campusName(b));
		});
	}

	async function fetchCampuses(): Promise<CampusV1DTO[]> {
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type: "api:campus:list" }),
			MESSAGE_TIMEOUT_MS,
		);
		if (res?.data) return sortCampuses(res.data.campuses ?? []);
		throw new Error(formatError(res?.error));
	}

	async function fetchOwnCampusId(): Promise<string | null> {
		try {
			const loginRes = await withTimeout(
				chrome.runtime.sendMessage({ type: "profile:login" }),
				MESSAGE_TIMEOUT_MS,
			);
			const login = loginRes && typeof loginRes.login === "string" ? loginRes.login : null;
			if (!login) return null;
			const res = await withTimeout(
				chrome.runtime.sendMessage({ type: "api:participant", login }),
				MESSAGE_TIMEOUT_MS,
			);
			if (res?.data) return res.data.campus?.id ?? null;
			return null;
		} catch {
			return null;
		}
	}

	async function fetchClusters(id: string): Promise<ClusterV1DTO[]> {
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type: "api:campus:clusters", campusId: id }),
			MESSAGE_TIMEOUT_MS,
		);
		if (res?.data) return res.data.clusters ?? [];
		throw new Error(formatError(res?.error));
	}

	async function loadClusters(id: string) {
		clusterLoading = true;
		try {
			const clusters = await fetchClusters(id);
			const campuses = viewState.kind === "clusters" ? viewState.campuses : [];
			viewState = { kind: "clusters", campuses, clusters };
		} catch {
			viewState = { kind: "error", message: "Не удалось загрузить кластеры" };
		} finally {
			clusterLoading = false;
		}
	}

	async function load() {
		if (!isChromeExt) {
			viewState = { kind: "error", message: "Доступно только внутри расширения" };
			return;
		}
		viewState = { kind: "loading" };
		try {
			const campuses = await fetchCampuses();
			if (!campuses.length) {
				viewState = { kind: "error", message: "Список кампусов пуст" };
				return;
			}
			// Автовыбор кампуса, в котором зарегистрирован пользователь.
			const ownCampusId = await fetchOwnCampusId();
			const desired = ownCampusId || campusId || "";
			campusId = campuses.some((c) => c.id === desired) ? desired : campuses[0].id;
			try {
				const clusters = await fetchClusters(campusId);
				viewState = { kind: "clusters", campuses, clusters };
			} catch {
				viewState = { kind: "error", message: "Не удалось загрузить кластеры" };
			}
		} catch {
			viewState = { kind: "error", message: "Нет ответа от фона (таймаут)" };
			logError("campus map: load failed", "campus");
		}
	}

	function onCampusChange() {
		void loadClusters(campusId);
	}

	function clusterFill(c: ClusterV1DTO): number {
		return c.capacity ? Math.round(((c.capacity - c.availableCapacity) / c.capacity) * 100) : 0;
	}

	onMount(() => {
		void load();
	});
</script>

{#if viewState.kind === "loading"}
	<p class="animate-pulse text-xs text-slate-400">Загружаем карту кампуса…</p>
{:else if viewState.kind === "error"}
	<p
		class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
	>
		{viewState.message}
	</p>
{:else}
	<div class="flex flex-col gap-2.5">
		<div class="flex items-center gap-2">
			<select
				bind:value={campusId}
				onchange={onCampusChange}
				class="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800"
			>
				{#each viewState.campuses as c (c.id)}
					<option value={c.id}>{campusName(c)}</option>
				{/each}
			</select>
			<button
				onclick={() => void load()}
				class="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400"
				title="Обновить"
			>
				⟳
			</button>
		</div>

		<div class="flex flex-col gap-2">
			{#if clusterLoading}
				<p class="animate-pulse text-xs text-slate-400">Обновляем…</p>
			{:else}
				{#each viewState.clusters as c (c.id)}
					<div
						class="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
					>
						<div class="flex items-center justify-between gap-2">
							<p class="text-sm font-bold text-blue-600 dark:text-blue-400">{c.name}</p>
							<p class="text-[10px] text-slate-400">этаж {c.floor}</p>
						</div>
						<div class="mt-1 flex items-end justify-between gap-2">
							<p class="text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
								{c.capacity - c.availableCapacity}
								<span class="text-slate-400 dark:text-slate-500"> / {c.capacity} мест занято</span>
							</p>
							<p class="text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
								{clusterFill(c)}%
							</p>
						</div>
						<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
							<div
								class="h-full rounded-full bg-blue-600"
								style="width: {clusterFill(c)}%"
							></div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}