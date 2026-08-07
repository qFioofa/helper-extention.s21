<script lang="ts">
	import { onMount } from "svelte";
	import { logError } from "../../../core/logger.svelte";
	import type { EventV1DTO } from "@s21/api";
	import { S21_PLATFORM_ORIGIN, S21_PLATFORM_ROUTES } from "@s21/api";
	import PlatformLink from "../../shared/PlatformLink.svelte";

	const MESSAGE_TIMEOUT_MS = 20_000;

	type State =
		| { kind: "loading" }
		| { kind: "error"; message: string }
		| { kind: "done"; events: EventV1DTO[] };

	const TYPE_LABEL: Record<string, string> = {
		ACTIVITY: "Активность",
		EXAM: "Экзамен",
		TEST: "Тест",
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
				chrome.runtime.sendMessage({
					type: "api:events",
					from: new Date().toISOString(),
					to: new Date(Date.now() + 2592e6).toISOString(),
					limit: 20,
				}),
				MESSAGE_TIMEOUT_MS,
			);
			if (res?.data) {
				viewState = { kind: "done", events: res.data.events ?? [] };
			} else if (res?.error) {
				viewState = { kind: "error", message: formatError(res.error) };
			} else {
				viewState = { kind: "error", message: "Пустой ответ от фона" };
			}
		} catch {
			viewState = { kind: "error", message: "Нет ответа от фона (таймаут)" };
			logError("events: timeout", "events");
		}
	}

	onMount(() => {
		void load();
	});
</script>

{#if viewState.kind === "loading"}
	<p class="animate-pulse text-xs text-slate-400">Загружаем события…</p>
{:else if viewState.kind === "error"}
	<p
		class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
	>
		{viewState.message}
	</p>
{:else if viewState.events.length === 0}
	<p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50">
		Нет предстоящих событий.
	</p>
{:else}
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<PlatformLink path={S21_PLATFORM_ROUTES.events} label="События на сайте" />
		</div>
		<ul class="flex flex-col gap-2.5">
			{#each viewState.events as e (e.id)}
				<li>
					<a
						href={`${S21_PLATFORM_ORIGIN}${S21_PLATFORM_ROUTES.event(e.id)}`}
						target="_blank"
						rel="noopener noreferrer"
						class="block"
					>
						<div class="flex items-center justify-between gap-2">
							<p class="truncate text-sm font-semibold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
								{e.name}
							</p>
							<span
								class="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
							>
								{TYPE_LABEL[e.type] ?? e.type}
							</span>
						</div>
						<p class="text-xs text-slate-500 dark:text-slate-400">
							{new Date(e.startDateTime).toLocaleString("ru-RU")} · {e.location}
						</p>
						{#if e.description}
							<p class="mt-0.5 line-clamp-2 text-[11px] text-slate-400 dark:text-slate-500">
								{e.description}
							</p>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}