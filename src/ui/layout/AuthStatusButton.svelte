<script lang="ts">
	import { onMount } from "svelte";
	import { auth, initAuthStore, requestLogin, requestLogout } from "../../core/stores/auth.svelte";
	import Icon from "../shared/Icon.svelte";

	let { collapsed = false }: { collapsed?: boolean } = $props();

	const LABEL = {
		authorized: "Выйти",
		unauthorized: "Войти",
		offline: "Настроить",
		unknown: "…",
	} as const;

	const DOT = {
		authorized: "bg-emerald-500",
		unauthorized: "bg-amber-500",
		offline: "bg-rose-500",
		unknown: "bg-slate-400 animate-pulse",
	} as const;

	const STYLE = {
		authorized:
			"border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
		unauthorized:
			"border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/40",
		offline:
			"border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40",
		unknown:
			"border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800",
	} as const;

	onMount(() => {
		initAuthStore();
	});

	function onClick() {
		if (auth.status === "authorized") {
			requestLogout();
		} else if (auth.status !== "unknown") {
			requestLogin();
		}
	}
</script>

<button
	onclick={onClick}
	class="flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors {STYLE[auth.status]}"
	title="Авторизация"
>
	<Icon name="user" size={14} class="shrink-0" />
	<span class="h-2 w-2 rounded-full {DOT[auth.status]}"></span>
	{#if !collapsed}
		<span>{LABEL[auth.status]}</span>
	{/if}
</button>