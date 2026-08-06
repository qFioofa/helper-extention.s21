<script lang="ts">
	import { onMount } from "svelte";
	import { applyTheme } from "./core/stores/theme.svelte";
	import Header from "./ui/layout/Header.svelte";
	import SideNav from "./ui/layout/SideNav.svelte";
	import ContentArea from "./ui/layout/ContentArea.svelte";
	import Footer from "./ui/layout/Footer.svelte";

	onMount(() => {
		applyTheme();
	});
</script>

<div
	class="flex h-full w-full flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100"
>
	<Header />
	<div class="flex min-h-0 flex-1">
		<SideNav />
		<ContentArea />
	</div>
	<Footer />
</div>
