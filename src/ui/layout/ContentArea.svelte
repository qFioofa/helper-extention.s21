<script lang="ts">
	import { categories } from "../../core/registry";
	import { activeCategoryId, selectCategory } from "../../core/stores/category.svelte";
	import { peerSearchRequest } from "../../core/stores/peerSearch.svelte";
	import Island from "../islands/Island.svelte";

	const activeCategory = $derived(
		categories.find((c) => c.id === activeCategoryId.value) ?? categories[0],
	);

	let handledNonce = 0;

	// Внешний запрос (например, из поиска по проектам): переключаемся на вкладку
	// поиска участника. Сам поиск выполнит SearchPanel через peerSearchRequest.
	$effect(() => {
		const req = peerSearchRequest;
		if (req.nonce > handledNonce) {
			handledNonce = req.nonce;
			selectCategory("search");
		}
	});
</script>

<main class="flex-1 overflow-y-auto p-3 pl-16">
	<h2 class="mb-3 text-sm font-bold">{activeCategory.title}</h2>
	<div
		class="grid gap-4"
		style="grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));"
	>
		{#each activeCategory.islands as island (activeCategoryId + island.id)}
			<Island {island} />
		{/each}
	</div>
</main>
