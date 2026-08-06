<script lang="ts">
	let { checked }: { checked: boolean } = $props();
</script>

<span
	class="relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors {checked
		? 'bg-blue-600'
		: 'bg-slate-300'}"
>
	<span
		class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
		style="left: 2px; transform: translateX({checked ? 16 : 0}px);"
	></span>
</span>
