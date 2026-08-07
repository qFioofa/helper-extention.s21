<script lang="ts">
	import { S21_PLATFORM_ORIGIN } from "@s21/api";

	let {
		path,
		label,
		classOverride,
	}: { path: string; label: string; classOverride?: string } = $props();
</script>

<a
	href={`${S21_PLATFORM_ORIGIN}${path}`}
	target="_blank"
	rel="noopener noreferrer"
	class={classOverride ??
		"inline-flex items-center gap-1 text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"}
	title="Открыть на платформе 21 School"
>
	{label}<span class="text-[11px]">↗</span>
</a>