<script lang="ts">
	import { onMount } from "svelte";
	import { auth, initAuthStore } from "../../core/stores/auth.svelte";

	const STATUS_LABEL = {
		authorized: "API: авторизован",
		unauthorized: "API: нужен вход",
		offline: "API: недоступен",
		unknown: "API: проверка…",
	} as const;

	const STATUS_DOT = {
		authorized: "bg-emerald-500",
		unauthorized: "bg-amber-500",
		offline: "bg-rose-500",
		unknown: "bg-slate-400",
	} as const;

	onMount(() => {
		initAuthStore();
	});
</script>

<footer
	class="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500"
>
	<span class="flex items-center gap-1.5">
		<span class="h-1.5 w-1.5 rounded-full {STATUS_DOT[auth.status]}"></span>
		{STATUS_LABEL[auth.status]}
	</span>
	<span>v0.0.1 · прототип layout</span>
</footer>