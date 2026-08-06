<script lang="ts">
	import { icons } from "./icons";

	let {
		name,
		size = 16,
		class: className = "",
	}: { name: string; size?: number; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	{@html icons[name] ?? ""}
</svg>
