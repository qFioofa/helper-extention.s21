<script lang="ts">
	import { icons } from "./icons";

	let {
		name,
		size = 16,
		class: className = "",
	}: { name: string; size?: number; class?: string } = $props();

	let hostEl: HTMLSpanElement | undefined = $state();

	const nodes = $derived(icons[name] ?? []);
	const NS = "http://www.w3.org/2000/svg";

	function renderHost() {
		const host = hostEl;
		if (!host) return;
		const svg = document.createElementNS(NS, "svg");
		svg.setAttribute("width", String(size));
		svg.setAttribute("height", String(size));
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");
		svg.setAttribute("aria-hidden", "true");
		for (const node of nodes) {
			const el = document.createElementNS(NS, node.tag);
			for (const [key, value] of Object.entries(node.attrs)) {
				el.setAttribute(key, value);
			}
			svg.appendChild(el);
		}
		host.replaceChildren(svg);
	}

	$effect(() => {
		renderHost();
	});
</script>

<span class={className} aria-hidden="true" bind:this={hostEl}></span>