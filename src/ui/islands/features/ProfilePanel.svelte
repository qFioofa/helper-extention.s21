<script lang="ts">
	import { onMount } from "svelte";
	import { auth } from "../../../core/stores/auth.svelte";
	import { logError, logInfo } from "../../../core/logger.svelte";
	import type { FullProfile } from "../../../api/peer";
	import ProfileView from "./ProfileView.svelte";

	const MESSAGE_TIMEOUT_MS = 20_000;

	type State =
		| { kind: "loading" }
		| { kind: "error"; message: string }
		| { kind: "done"; profile: FullProfile };

	let nick = $state("");
	let savedNick = $state<string | null>(null);
	let editing = $state(false);
	let viewState = $state<State>({ kind: "loading" });

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

	/** Сохраняет ник в chrome.storage (используется для идентификации себя). */
	async function persistNick(login: string): Promise<boolean> {
		if (!isChromeExt) return false;
		try {
			const res = await withTimeout(
				chrome.runtime.sendMessage({ type: "profile:set-login", login }),
				4000,
			);
			if (res?.ok) {
				savedNick = login;
				nick = login;
				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	/** Получает логин текущего пользователя (токен/вкладка/platform) или сохранённый ник. */
	async function fetchOwnLogin(): Promise<string | null> {
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type: "profile:login" }),
			MESSAGE_TIMEOUT_MS,
		);
		return res && typeof res.login === "string" && res.login ? res.login : null;
	}

	async function fetchStoredNick(): Promise<string | null> {
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type: "profile:stored-login" }),
			4000,
		);
		return res && typeof res.login === "string" && res.login ? res.login : null;
	}

	async function fetchProfile(login: string): Promise<void> {
		if (login !== savedNick) await persistNick(login);
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type: "api:participant:full", login }),
			MESSAGE_TIMEOUT_MS,
		);
		if (res?.data) {
			viewState = { kind: "done", profile: res.data as FullProfile };
			logInfo(`own profile loaded (${login})`, "profile");
		} else if (res?.error) {
			viewState = { kind: "error", message: formatError(res.error) };
			logError(`own profile: ${formatError(res.error)}`, "profile");
		} else {
			viewState = { kind: "error", message: "Пустой ответ от фона" };
		}
	}

	async function load() {
		if (!isChromeExt) {
			viewState = { kind: "error", message: "Доступно только внутри расширения" };
			return;
		}
		viewState = { kind: "loading" };
		const stored = await fetchStoredNick();
		if (stored) {
			savedNick = stored;
			nick = stored;
		}
		try {
			const login = await fetchOwnLogin();
			if (login) {
				savedNick = login;
				nick = login;
				await fetchProfile(login);
			} else {
				// Variant B: логин не определился — просим ввести ник вручную.
				viewState = { kind: "error", message: "Не удалось определить логин автоматически" };
			}
		} catch {
			viewState = { kind: "error", message: "Нет ответа от фона (таймаут)" };
			logError("own profile: timeout", "profile");
		}
	}

	function submitNick() {
		const login = nick.trim();
		if (!login) return;
		editing = false;
		void (async () => {
			viewState = { kind: "loading" };
			await fetchProfile(login);
		})();
	}

	function startEdit() {
		nick = savedNick ?? "";
		editing = true;
	}

	onMount(() => {
		void load();
	});
</script>

{#if viewState.kind === "loading"}
	<p class="animate-pulse text-xs text-slate-400">Загружаем профиль…</p>
{:else if viewState.kind === "error"}
	<p
		class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
	>
		{viewState.message}
	</p>
	{#if !isChromeExt || viewState.message === "Не удалось определить логин автоматически"}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				submitNick();
			}}
			class="mt-2 flex flex-col gap-2"
		>
			<input
				bind:value={nick}
				type="text"
				placeholder="Ваш ник без @…"
				class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
			/>
			<button
				type="submit"
				disabled={!nick.trim()}
				class="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
			>
				Загрузить свой профиль
			</button>
		</form>
	{:else if auth.status !== "authorized"}
		<div
			class="mt-2 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
		>
			<p class="font-semibold">Нет авторизации</p>
			<p>Войдите в аккаунт (через сайт или логин/пароль), чтобы увидеть свой профиль.</p>
		</div>
	{/if}
{:else}
	<ProfileView profile={viewState.profile} />

	{#if editing}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				submitNick();
			}}
			class="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 dark:border-slate-700"
		>
			<input
				bind:value={nick}
				type="text"
				placeholder="Ваш ник без @…"
				class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
			/>
			<button
				type="submit"
				disabled={!nick.trim()}
				class="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
			>
				Сохранить
			</button>
		</form>
	{:else}
		<button
			onclick={startEdit}
			class="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
		>
			Изменить ник
		</button>
	{/if}
{/if}