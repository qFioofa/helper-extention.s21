<script lang="ts">
	import { onMount } from "svelte";
	import { logError, logInfo } from "../../../core/logger.svelte";
	import type { FullProfile } from "../../../api/peer";

	const MESSAGE_TIMEOUT_MS = 15_000;

	type State =
		| { kind: "loading" }
		| { kind: "error"; message: string }
		| { kind: "idle" }
		| { kind: "done"; profile: FullProfile };

	let state = $state<State>({ kind: "idle" });

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

	async function load() {
		if (!isChromeExt) {
			state = { kind: "error", message: "Доступно только внутри расширения" };
			return;
		}
		state = { kind: "loading" };
		try {
			const res = await withTimeout(
				chrome.runtime.sendMessage({ type: "api:participant:full" }),
				MESSAGE_TIMEOUT_MS,
			);
			if (res?.data) {
				state = { kind: "done", profile: res.data as FullProfile };
				logInfo(`own skills loaded (${res.data.participant.login})`, "profile");
			} else if (res?.error) {
				state = { kind: "error", message: formatError(res.error) };
				logError(`own skills: ${formatError(res.error)}`, "profile");
			} else {
				state = { kind: "error", message: "Пустой ответ от фона" };
			}
		} catch {
			state = { kind: "error", message: "Нет ответа от фона (таймаут)" };
			logError("own skills: timeout", "profile");
		}
	}

	onMount(() => {
		void load();
	});
</script>

{#if state.kind === "loading"}
	<p class="animate-pulse text-xs text-slate-400">Загружаем навыки…</p>
{:else if state.kind === "error"}
	<p
		class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
	>
		{state.message}
	</p>
{:else if state.kind === "done" && !state.profile.skills.length}
	<p class="text-xs text-slate-400">Навыки не заполнены.</p>
{:else if state.kind === "done"}
	<ul class="flex flex-col gap-2">
		{#each state.profile.skills as skill (skill.name)}
			<li>
				<div class="mb-1 flex items-center justify-between text-xs">
					<span class="font-medium">{skill.name}</span>
					<span class="tabular-nums text-slate-500 dark:text-slate-400">{skill.points}</span>
				</div>
				<div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
					<div
						class="h-full rounded-full bg-blue-600"
						style="width: {Math.min(100, Math.max(0, skill.points))}%"
					></div>
				</div>
			</li>
		{/each}
	</ul>
{/if}