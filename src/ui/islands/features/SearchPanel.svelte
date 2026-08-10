<script lang="ts">
	import Icon from "../../shared/Icon.svelte";
	import { logError, logInfo } from "../../../core/logger.svelte";
	import type { FullProfile } from "../../../api/peer";
	import ProfileView from "./ProfileView.svelte";
	import { peerSearchRequest } from "../../../core/stores/peerSearch.svelte";

	const MESSAGE_TIMEOUT_MS = 15_000;

	type LookupState =
		| { kind: "idle" }
		| { kind: "loading" }
		| { kind: "error"; message: string }
		| { kind: "done"; profile: FullProfile };

	let query = $state("");
	let lookup = $state<LookupState>({ kind: "idle" });

	let handledNonce = 0;

	// Внешний запрос (например, из поиска по проектам): переключаемся на поиск пира
	// и сразу выполняем поиск по логину.
	$effect(() => {
		const req = peerSearchRequest;
		if (req.nonce > handledNonce && req.login) {
			handledNonce = req.nonce;
			query = req.login;
			void search();
		}
	});

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

	async function search() {
		const login = query.trim();
		if (!login) return;
		if (!isChromeExt) {
			lookup = { kind: "error", message: "Доступно только внутри расширения" };
			return;
		}
		lookup = { kind: "loading" };
		try {
			const res = await withTimeout(
				chrome.runtime.sendMessage({ type: "api:participant:full", login }),
				MESSAGE_TIMEOUT_MS,
			);
			if (res?.data) {
				lookup = { kind: "done", profile: res.data as FullProfile };
				logInfo(`participant ${login} loaded`, "search");
			} else if (res?.error) {
				lookup = { kind: "error", message: formatError(res.error) };
				logError(`participant ${login}: ${formatError(res.error)}`, "search");
			} else {
				lookup = { kind: "error", message: "Пустой ответ от фона" };
			}
		} catch {
			lookup = { kind: "error", message: "Нет ответа от фона (таймаут)" };
			logError(`participant ${login}: timeout`, "search");
		}
	}
</script>

<div class="relative">
	<Icon
		name="search"
		size={14}
		class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
	/>
	<input
		bind:value={query}
		type="text"
		placeholder="Ник без @…"
		class="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-14 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
		onkeydown={(e) => {
			if (e.key === "Enter") void search();
		}}
	/>
	<button
		onclick={() => void search()}
		class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
		disabled={lookup.kind === "loading"}
	>
		Найти
	</button>
</div>

{#if lookup.kind === "loading"}
	<p class="mt-3 animate-pulse text-xs text-slate-400">Загружаем…</p>
{:else if lookup.kind === "error"}
	<p
		class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
	>
		{lookup.message}
	</p>
{:else if lookup.kind === "done"}
	<div class="mt-3">
		<ProfileView profile={lookup.profile} />
	</div>
{/if}

{#if lookup.kind === "idle"}
	<p class="mt-3 text-[11px] text-slate-400">
		Введите ник участника, чтобы увидеть уровень, PRP, место и проекты.
	</p>
{/if}
