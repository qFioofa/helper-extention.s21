<script lang="ts">
	import { onMount } from "svelte";
	import { auth } from "../../../core/stores/auth.svelte";
	import { logError, logInfo } from "../../../core/logger.svelte";
	import type { FullProfile } from "../../../api/peer";
	import ProfileView from "./ProfileView.svelte";

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
				logInfo(`own profile loaded (${res.data.participant.login})`, "profile");
			} else if (res?.error) {
				state = { kind: "error", message: formatError(res.error) };
				logError(`own profile: ${formatError(res.error)}`, "profile");
			} else {
				state = { kind: "error", message: "Пустой ответ от фона" };
			}
		} catch {
			state = { kind: "error", message: "Нет ответа от фона (таймаут)" };
			logError("own profile: timeout", "profile");
		}
	}

	onMount(() => {
		void load();
	});
</script>

{#if auth.status !== "authorized"}
	<div
		class="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
	>
		<p class="font-semibold">Нет авторизации</p>
		<p>Войдите в аккаунт, чтобы увидеть свой профиль.</p>
	</div>
{:else if state.kind === "loading"}
	<p class="animate-pulse text-xs text-slate-400">Загружаем профиль…</p>
{:else if state.kind === "idle"}
	<p class="text-xs text-slate-400">Нажмите «Профиль» для загрузки.</p>
{:else if state.kind === "error"}
	<p
		class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
	>
		{state.message}
	</p>
{:else}
	<ProfileView profile={state.profile} />
{/if}

{#if state.kind === "done"}
	<div class="mt-1 flex justify-center">
		<button
			onclick={() => void load()}
			class="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
		>
			Обновить
		</button>
	</div>
{/if}