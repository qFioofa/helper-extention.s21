<script lang="ts">
	import { onMount } from "svelte";
	import { applyTheme } from "./core/stores/theme.svelte";
	import { initAuthStore } from "./core/stores/auth.svelte";
	import { initLogger } from "./core/logger.svelte";
	import Header from "./ui/layout/Header.svelte";
	import SideNav from "./ui/layout/SideNav.svelte";
	import ContentArea from "./ui/layout/ContentArea.svelte";
	import Footer from "./ui/layout/Footer.svelte";

	let navCollapsed = $state(false);

	onMount(() => {
		applyTheme();
		initAuthStore();
		initLogger();
	});
</script>

<div
	class="flex h-full w-full flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100"
>
	<Header />
	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<SideNav bind:collapsed={navCollapsed} />
		{#if !navCollapsed}
			<button
				class="absolute inset-0 z-10 cursor-default"
				aria-label="Закрыть панель категорий"
				onclick={() => (navCollapsed = true)}
			></button>
		{/if}
		<ContentArea />
	</div>
	<Footer />
</div>
