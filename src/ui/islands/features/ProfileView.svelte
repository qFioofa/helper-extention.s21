<script lang="ts">
	import type { ParticipantProjectV1DTO } from "@qfioofa/s21-api";
	import { S21_PLATFORM_ORIGIN } from "@qfioofa/s21-api";
	import { PROJECT_STATUS_LABEL } from "../../../api/peer";
	import type { BootcampCourse, FullProfile } from "../../../api/peer";
	import ProjectLink from "../../shared/ProjectLink.svelte";

	let { profile }: { profile: FullProfile } = $props();

	const p = $derived(profile.participant);
	const points = $derived(profile.points);

	// Дефензивные дефолты: старые/частичные ответы не должны ронять виджет.
	const inReviews = $derived(profile.inReviews ?? []);
	const waitingTeam = $derived(profile.waitingTeam ?? []);
	const inProgress = $derived(profile.inProgress ?? []);
	const bootcamps = $derived(profile.bootcamps ?? []);
	const assigned = $derived(profile.assigned ?? []);
	const completed = $derived(profile.completed ?? []);

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

	function bootcampRow(bc: BootcampCourse) {
		return bc.title;
	}

	/** Цвет ячейки внутреннего проекта курса — как на платформе:
	 * синий — зарегистрирован, фиолетовый — в процессе, жёлтый — на ревью,
	 * зелёный — завершён, красный — провален. */
	function courseCellClass(pj: ParticipantProjectV1DTO): string {
		const s = (pj.status ?? "").toUpperCase();
		if (s.includes("REVIEW"))
			return "border-yellow-300 bg-yellow-100 text-yellow-900 dark:border-yellow-500/60 dark:bg-yellow-400/20 dark:text-yellow-100";
		if (s === "IN_PROGRESS")
			return "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-500/60 dark:bg-violet-400/20 dark:text-violet-100";
		if (s === "REGISTERED")
			return "border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-500/60 dark:bg-blue-400/20 dark:text-blue-100";
		if (s === "ACCEPTED")
			return "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-400/20 dark:text-emerald-100";
		if (s === "FAILED")
			return "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-500/60 dark:bg-rose-400/20 dark:text-rose-100";
		return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
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
				href={`${S21_PLATFORM_ORIGIN}/profile/${encodeURIComponent(p.login)}`}
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

	{#if !inReviews.length && !waitingTeam.length && !inProgress.length && !bootcamps.length && !assigned.length && !completed.length}
		<p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50">
			Нет данных о проектах.
		</p>
	{/if}

	<!-- 1. На peer-review -->
	{#if inReviews.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">
				На ревью
			</p>
			<ul class="flex flex-col gap-1">
				{#each inReviews as pj (pj)}
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

	<!-- 2. Ищут команду -->
	{#if waitingTeam.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-violet-600 dark:text-violet-400">
				Ищут команду
			</p>
			<ul class="flex flex-col gap-1">
				{#each waitingTeam as pj (pj)}
					<li
						class="flex items-center justify-between gap-2 rounded-md bg-violet-50 px-2 py-1.5 text-xs dark:bg-violet-950/30"
					>
						<ProjectLink projectId={pj.id} label={projectRow(pj)} />
						<span class="shrink-0 text-[10px] text-slate-400">{projectBadge(pj)}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- 3. In progress (включая буткемпы) -->
	{#if inProgress.length || bootcamps.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400">
				Выполняет сейчас
			</p>
			<ul class="flex flex-col gap-1">
				{#each inProgress as pj (pj.id)}
					<li
						class="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800/50"
					>
						<ProjectLink projectId={pj.id} label={projectRow(pj)} />
						<span class="shrink-0 text-[10px] text-slate-400">{projectBadge(pj)}</span>
					</li>
				{/each}
			</ul>

			<!-- Буткемпы (курсы) с внутренними проектами -->
			{#if bootcamps.length}
				<div class="mt-1.5 flex flex-col gap-1">
					{#each bootcamps as bc (bc.id)}
						<div
							class="rounded-md border border-blue-100 bg-blue-50/60 px-2 py-1.5 text-xs dark:border-blue-900/40 dark:bg-blue-950/30"
						>
							<p class="mb-1 flex items-center justify-between gap-2 font-semibold text-blue-700 dark:text-blue-300">
								<a
									href={`${S21_PLATFORM_ORIGIN}/course/${bc.id}`}
									target="_blank"
									rel="noopener noreferrer"
									class="truncate underline-offset-2 hover:underline"
									title="Открыть буткемп на платформе"
								>
									{bootcampRow(bc)}
								</a>
								<span class="shrink-0 text-[10px] font-normal text-slate-400">буткемп</span>
							</p>
							{#if (bc.projects ?? []).length}
								<ul class="mt-1 flex flex-col gap-1 border-t border-blue-100 pt-1 dark:border-blue-900/40">
									{#each bc.projects ?? [] as proj (proj.id)}
										<li
											class="flex items-center justify-between gap-2 rounded-md border px-2 py-1 {courseCellClass(proj)}"
										>
											<ProjectLink projectId={proj.id} label={proj.title} />
											<span class="shrink-0 text-[10px] text-slate-400">
												{PROJECT_STATUS_LABEL[proj.status] ?? proj.status}
											</span>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-[10px] text-slate-400">Внутренние проекты не найдены</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- 4. Записано -->
	{#if assigned.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
				Записано
			</p>
			<ul class="flex flex-col gap-1">
				{#each assigned as pj (pj.id)}
					<li
						class="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800/50"
					>
						<ProjectLink projectId={pj.id} label={projectRow(pj)} />
						<span class="shrink-0 text-[10px] text-slate-400">
							{PROJECT_STATUS_LABEL[pj.status] ?? pj.status}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- 5. Последние выполненные -->
	{#if completed.length}
		<div>
			<p class="mb-1 text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
				Последние выполненные
			</p>
			<ul class="flex flex-col gap-1">
				{#each completed as item (item.project)}
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