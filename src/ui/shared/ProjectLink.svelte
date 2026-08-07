<script lang="ts">
	import { S21_PLATFORM_ORIGIN, S21_PLATFORM_ROUTES } from "@qfioofa/s21-api";

	let {
		projectId,
		label,
	}: {
		projectId: number;
		label: string;
	} = $props();
</script>

<a
	href={`${S21_PLATFORM_ORIGIN}${S21_PLATFORM_ROUTES.project(projectId)}`}
	target="_blank"
	rel="noopener noreferrer"
	class="truncate text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
	title="Открыть проект в новой вкладке"
>
	{label}
</a>