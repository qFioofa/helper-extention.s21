<script lang="ts">
	const STORAGE_KEY = "demoCount";

	let count = $state(0);
	let activeUrl = $state("");

	$effect(() => {
		if (import.meta.env.DEV) return;
		chrome.storage.sync.get({ [STORAGE_KEY]: 0 }, (items) => {
			count = items[STORAGE_KEY];
		});
	});

	function increment() {
		count += 1;
		save();
	}

	function decrement() {
		count -= 1;
		save();
	}

	function reset() {
		count = 0;
		save();
	}

	function save() {
		if (import.meta.env.DEV) return;
		chrome.storage.sync.set({ [STORAGE_KEY]: count });
	}

	async function showActiveTab() {
		if (import.meta.env.DEV) {
			activeUrl = "dev mode (no chrome APIs)";
			return;
		}
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		activeUrl = tab?.url ?? "no active tab";
	}
</script>

<div class="flex w-full flex-col gap-4 bg-slate-50 p-4 font-sans text-slate-800">
	<header class="flex items-center gap-3">
		<img src="/icons/icon48.png" alt="logo" class="h-10 w-10 rounded-lg" />
		<div>
			<h1 class="text-base font-bold">Helper Extension S21</h1>
			<p class="text-xs text-slate-500">Svelte 5 + Vite + Tailwind</p>
		</div>
	</header>

	<main class="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
		<section class="flex items-center justify-between">
			<span class="text-sm font-medium">Counter</span>
			<span class="text-2xl font-bold tabular-nums text-blue-600">{count}</span>
		</section>

		<section class="flex gap-2">
			<button
				onclick={decrement}
				class="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-300"
			>
				-1
			</button>
			<button
				onclick={increment}
				class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
			>
				+1
			</button>
			<button
				onclick={reset}
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
			>
				Reset
			</button>
		</section>

		<section class="flex flex-col gap-2">
			<button
				onclick={showActiveTab}
				class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
			>
				Show active tab
			</button>
			{#if activeUrl}
				<p class="break-all rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
					{activeUrl}
				</p>
			{/if}
		</section>
	</main>

	<footer class="text-center text-xs text-slate-400">Demo extension — manifest version 2</footer>
</div>
