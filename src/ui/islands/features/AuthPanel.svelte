<script lang="ts">
	import { onMount } from "svelte";
	import {
		auth,
		initAuthStore,
		registerWithPassword,
		requestLogin,
		requestLogout,
	} from "../../../core/stores/auth.svelte";
	import { initTokenStore, refreshTokenValue, resetToken, token } from "../../../core/stores/token.svelte";
	import Icon from "../../shared/Icon.svelte";

	const STATUS_TEXT = {
		authorized: "Сессия активна. Токен получен, данные доступны через API.",
		unauthorized: "Войдите по логину/паролю или через сайт.",
		offline: "API платформы недоступен.",
		unknown: "Проверяем статус сессии…",
	} as const;

	let username = $state("");
	let password = $state("");
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let copied = $state(false);

	onMount(() => {
		initAuthStore();
		initTokenStore();
	});

	async function submit() {
		if (submitting) return;
		if (!username.trim() || !password) {
			error = "Введите логин и пароль";
			return;
		}
		submitting = true;
		error = null;
		const res = await registerWithPassword(username.trim(), password);
		password = "";
		if (res.ok) {
			await refreshTokenValue();
		} else {
			error = res.error ?? "Не удалось войти";
		}
		submitting = false;
	}

	async function copyToken() {
		if (!token.value) return;
		try {
			await navigator.clipboard.writeText(token.value);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch {
			/* clipboard may be unavailable */
		}
	}
</script>

<div class="flex flex-col gap-2.5">
	<p class="text-xs text-slate-500 dark:text-slate-400">{STATUS_TEXT[auth.status]}</p>

	{#if auth.status === "authorized"}
		{#if token.value}
			<div class="flex items-center gap-2">
				<p class="flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 font-mono text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
					<span class="font-semibold">Токен:</span>
					{token.value}
				</p>
				<button
					onclick={copyToken}
					class="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
					title="Скопировать токен"
				>
					<Icon name={copied ? "check" : "key"} size={14} />
				</button>
			</div>
		{/if}
		<button
			onclick={() => {
				requestLogout();
				resetToken();
			}}
			class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
		>
			<Icon name="user" size={15} />
			Выйти
		</button>
	{:else if auth.status === "unknown"}
		<p class="text-xs text-slate-400">Пожалуйста, подождите…</p>
	{:else}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
			class="flex flex-col gap-2"
		>
			<input
				bind:value={username}
				type="text"
				autocomplete="username"
				placeholder="Логин"
				class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
			/>
			<input
				bind:value={password}
				type="password"
				autocomplete="current-password"
				placeholder="Пароль"
				class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
			/>
			{#if error}
				<p class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
					{error}
				</p>
			{/if}
			<button
				type="submit"
				disabled={submitting}
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
			>
				<Icon name="key" size={15} />
				{submitting ? "Входим…" : "Войти по логин/пароль"}
			</button>
		</form>
		<button
			onclick={requestLogin}
			class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
			title="Войти через сайт (не заводит пароль здесь)"
		>
			<Icon name="user" size={15} />
			Войти через сайт
		</button>
	{/if}
</div>