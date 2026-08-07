<script lang="ts">
	import type { ParticipantProjectV1DTO } from "@qfioofa/s21-api";
	import { S21_PLATFORM_ORIGIN, S21_PLATFORM_ROUTES } from "@qfioofa/s21-api";
	import type { FullProfile } from "../../../api/peer";
	import ProjectLink from "../../shared/ProjectLink.svelte";

	let { profile }: { profile: FullProfile } = $props();

	const p = $derived(profile.participant);
	const points = $derived(profile.points);

	const STATUS_LABEL: Record<string, string> = {
		ACTIVE: "Активен",
		TEMPORARY_BLOCKING: "Врем. блок",
		EXPELLED: "Отчислен",
		BLOCKED: "Заблокирован",
		FROZEN: "Заморожен",
		STUDY_COMPLETED: "Выпускник",
	};

	function projectRow(pj: ParticipantProjectV1DTO) {
		return pj.title;
	}

	function projectBadge(pj: ParticipantProjectV1DTO): string {
		if (pj.type === "GROUP") return "группа";
		if (pj.type === "INDIVIDUAL") return "соло";
		return pj.type.toLowerCase();
	}
</script>

<div class="flex flex-col gap-2.5">
	<!-- Шапка -->
	<div class="flex items-center gap-3">
		<div
			class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white"
		>
			{p.login[0]?.toUpperCase() ?? "?"}
		</div>
		<div class="min-w-0 flex-1">
			<a
				href={`${S21_PLATFORM_ORIGIN}${S21_PLATFORM_ROUTES.user(p.login)}`}
				target="_blank"
				rel="noopener noreferrer"
				class="truncate text-sm font-bold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
				title="Открыть профиль на платформе"
			>
				{p.login}
			</a>
			<p class="truncate text-xs text-slate-500 dark:text-slate-400">
				{p.parallelName ? `Волна ${p.parallelName}` : ""}
				{p.className ? `${p.parallelName ? " · " : ""}${p.className}` : ""}</p>
			<p class="truncate text-xs text-slate-500 dark:text-slate-400">
				{p.campus.shortName}
				{STATUS_LABEL[p.status] ? ` · ${STATUS_LABEL[p.status]}` : ""}
			</p>
		</div>
	</div>

	<!-- Ключевые показатели -->
	<div class="grid grid-cols-2 gap-2">
		<div class="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
			<p class="text-[10px] uppercase text-slate-400">Уровень</p>
			<p class="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">{p.level}</p>
			<p class="text-[10px] text-slate-400">
				{p.expValue.toLocaleString("ru-RU")} XP
			</p>
		</div>
		<div class="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
			<p class="text-[10px] uppercase text-slate-400">PRP</p>
			<p class="text-lg font-bold tabular-nums">
				{points?.peerReviewPoints ?? "—"}
			</p>
			<p class="text-[10px] text-slate-400">
				{points && points.codeReviewPoints != null
					? `CRP ${points.codeReviewPoints}`
					: "peer review"}
			</p>
		</div>
	</div>

	<!-- Место в кластере -->
	{#if profile.workstation}
		<div class="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
			<p class="text-[10px] uppercase text-slate-400">Место</p>
			<p class="text-sm font-semibold">
				{profile.workstation.clusterName} · ряд {profile.workstation.row} · место{" "}
				{profile.workstation.number}
			</p>
		</div>
	{/if}

	{#if !profile.inProgress.length && !profile.inReviews.length && !profile.waitingTeam.length && !profile.completed.length}
		<p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50">
			Нет данных о проектах.
		</p>
	{/if}

	<!-- Проекты сейчас -->
	{#if profile.inProgress.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400">
				Выполняет сейчас
			</p>
			<ul class="flex flex-col gap-1">
{#each profile.inProgress as pj (pj.id)}
						<li
							class="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800/50"
						>
							<ProjectLink projectId={pj.id} label={projectRow(pj)} />
							<span class="shrink-0 text-[10px] text-slate-400">{projectBadge(pj)}</span>
						</li>
					{/each}
			</ul>
		</div>
	{/if}

	<!-- На peer-review -->
	{#if profile.inReviews.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">
				На peer-review
			</p>
			<ul class="flex flex-col gap-1">
{#each profile.inReviews as pj (pj)}
						<li
							class="flex items-center justify-between gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs dark:bg-amber-950/30"
						>
							<ProjectLink projectId={pj.id} label={projectRow(pj)} />
							<span class="shrink-0 text-[10px] text-slate-400">{projectBadge(pj)}</span>
						</li>
					{/each}
			</ul>
		</div>
	{/if}

	<!-- Групповые: ждут команду -->
	{#if profile.waitingTeam.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-violet-600 dark:text-violet-400">
				Групповые · ждут команду
			</p>
			<ul class="flex flex-col gap-1">
{#each profile.waitingTeam as pj (pj)}
						<li
							class="flex items-center justify-between gap-2 rounded-md bg-violet-50 px-2 py-1.5 text-xs dark:bg-violet-950/30"
						>
							<ProjectLink projectId={pj.id} label={projectRow(pj)} />
							<span class="shrink-0 text-[10px] text-slate-400">{pj.status}</span>
						</li>
					{/each}
			</ul>
		</div>
	{/if}

	<!-- Последние выполненные -->
	{#if profile.completed.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
				Последние выполненные
			</p>
			<ul class="flex flex-col gap-1">
{#each profile.completed as item (item.project)}
						<li
							class="flex items-center justify-between gap-2 rounded-md bg-emerald-50 px-2 py-1.5 text-xs dark:bg-emerald-950/30"
						>
							<ProjectLink projectId={item.project.id} label={projectRow(item.project)} />
							<span class="shrink-0 whitespace-nowrap text-[10px] text-slate-400">
								{item.completedAgo}
							</span>
						</li>
					{/each}
			</ul>
		</div>
	{/if}
</div>
