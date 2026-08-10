<script lang="ts">
	import { onMount } from "svelte";
	import { S21_PLATFORM_ORIGIN, S21_PLATFORM_ROUTES } from "@qfioofa/s21-api";
	import Icon from "../../shared/Icon.svelte";
	import { logError, logInfo, logWarn } from "../../../core/logger.svelte";
	import type { ProjectKind } from "../../../api/project";
	import ProjectCategory from "./ProjectCategory.svelte";
	import {
		loadCourseProjects,
		projectSearch,
		resetCategories,
		resetSelection,
	} from "../../../core/stores/projectSearch.svelte";

	const MESSAGE_TIMEOUT_MS = 25_000;

	type State =
		| { kind: "idle" }
		| { kind: "loading" }
		| { kind: "error"; message: string }
		| { kind: "ready" };

	const isChromeExt = typeof chrome !== "undefined" && !!chrome.runtime?.id;

	function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error("timeout")), ms);
			promise.then(
				(value) => {
					clearTimeout(timer);
					resolve(value);
				},
				(error) => {
					clearTimeout(timer);
					reject(error);
				},
			);
		});
	}

	function formatError(err: unknown): string {
		if (err && typeof err === "object") {
			const e = err as { status?: number; message?: string };
			if (typeof e.status === "number") return `HTTP ${e.status}`;
			if (e.message) return e.message;
		}
		return String(err);
	}

	async function send<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
		if (!isChromeExt) throw new Error("Доступно только внутри расширения");
		const res = await withTimeout(
			chrome.runtime.sendMessage({ type, ...payload }),
			MESSAGE_TIMEOUT_MS,
		);
		if (res?.error) throw res.error;
		return res?.data as T;
	}

	let viewState = $state<State>({ kind: "idle" });

	function norm(s: string): string {
		return s.trim().toLowerCase();
	}

	// Алгоритм "hits": остаются только проекты, в которых встречается запрос
	// (по названию или по ID), ближайшие совпадения идут первыми.
	const hits = $derived(() => {
		const q = norm(projectSearch.query);
		const catalog = projectSearch.catalog;
		if (!q || !catalog.length) return [] as typeof catalog;
		const digit = /^\d+$/.test(q);
		const scored: { e: (typeof catalog)[number]; s: number }[] = [];
		for (const e of catalog) {
			if (digit && String(e.projectId).startsWith(q)) {
				scored.push({ e, s: 0 });
				continue;
			}
			if (!digit) {
				const name = norm(e.name);
				if (name === q) scored.push({ e, s: 1 });
				else if (name.startsWith(q)) scored.push({ e, s: 2 });
				else if (name.includes(q)) scored.push({ e, s: 3 });
			}
		}
		return scored
			.sort((a, b) => a.s - b.s || a.e.name.localeCompare(b.e.name))
			.slice(0, 12)
			.map((x) => x.e);
	});

	function select(entry: { projectId: number; name: string; kind?: ProjectKind }) {
		projectSearch.selected = entry;
		projectSearch.query = entry.name;
		projectSearch.dropdownOpen = false;
	}

	/** Достаёт из ссылки (или просто текста) тип и ID: /project/{id} или /course/{id}. */
	function parseRef(s: string): { id: number; kind: ProjectKind } | null {
		const project = s.match(/\/project\/(\d+)/);
		if (project) return { id: Number(project[1]), kind: "project" };
		const course = s.match(/\/course\/(\d+)/);
		if (course) return { id: Number(course[1]), kind: "course" };
		return null;
	}

	async function refreshTitle(id: number, kind: ProjectKind = "project") {
		try {
			const title = await (kind === "course"
				? send<{ courseId: number; title: string }>("api:course:get", { courseId: id })
				: send<{ projectId: number; title: string }>("api:project:get", { projectId: id }));
			if (title?.title) select({ projectId: id, name: title.title, kind });
		} catch (err) {
			logWarn(`${kind} ${id} title: ${formatError(err)}`, "projects");
		}
	}

	/** Выбирает проект/курс по ID: мгновенно (название из каталога, иначе плейсхолдер), затем уточняет через API. */
	async function selectById(id: number, kind: ProjectKind = "project") {
		if (kind === "course") projectSearch.courseContext = null;
		const entry = projectSearch.catalog.find((e) => e.projectId === id && e.kind === kind);
		select(
			entry ?? {
				projectId: id,
				kind,
				name: kind === "course" ? `Курс #${id}` : `#${id}`,
			},
		);
		resetCategories();
		await refreshTitle(id, kind);
	}

	function choose(entry: { projectId: number; name: string; kind?: ProjectKind }) {
		if (entry.kind === "course") projectSearch.courseContext = null;
		select(entry);
		resetCategories();
		void refreshTitle(entry.projectId, entry.kind);
	}

	/** Открывает статистику проекта из списка проектов курса. */
	function openCourseProject(project: { projectId: number; name: string; kind?: ProjectKind }) {
		const course = projectSearch.selected;
		if (course?.kind === "course") {
			projectSearch.courseContext = { courseId: course.projectId, name: course.name };
		}
		choose(project);
	}

	/** Возвращается из проекта обратно к списку проектов курса. */
	async function goBackToCourse() {
		const ctx = projectSearch.courseContext;
		if (!ctx) return;
		await selectById(ctx.courseId, "course");
	}

	// Для выбранного курса подгружаем его проекты.
	$effect(() => {
		if (projectSearch.selected?.kind === "course") {
			void loadCourseProjects();
		}
	});

	function clearSelection() {
		resetSelection();
	}

	function selectId() {
		const q = norm(projectSearch.query);
		if (!/^\d+$/.test(q)) return;
		choose({ projectId: Number(q), name: projectSearch.query });
	}

	// Если в поле вставлена ссылка на проект/курс — извлекаем ID и подставляем название.
	async function selectFromUrl() {
		const ref = parseRef(projectSearch.query);
		if (!ref) return;
		await selectById(ref.id, ref.kind);
		projectSearch.dropdownOpen = false;
	}

	// Найти по ссылке: берём URL текущей активной вкладки и подставляем проект.
	async function parseFromActiveTab() {
		if (!isChromeExt) {
			viewState = { kind: "error", message: "Доступно только внутри расширения" };
			return;
		}
		viewState = { kind: "loading" };
		try {
			const res = await withTimeout(
				chrome.runtime.sendMessage({ type: "tab:active-url" }),
				5000,
			);
			const url: string | null | undefined = res?.url;
			if (typeof url !== "string" || !url) {
				viewState = { kind: "error", message: "Не удалось прочитать адрес вкладки" };
				return;
			}
			// Найти проект или курс по ссылке: берём URL текущей активной вкладки.
			const ref = parseRef(url);
			if (!ref) {
				viewState = {
					kind: "error",
					message: "На активной вкладке нет ссылки на проект или курс",
				};
				return;
			}
			await selectById(ref.id, ref.kind);
			viewState = { kind: "ready" };
			logInfo(`${ref.kind} from active tab: ${ref.id}`, "projects");
		} catch (err) {
			viewState = { kind: "error", message: formatError(err) };
			logError(`project from active tab: ${formatError(err)}`, "projects");
		}
	}

	async function loadCatalog() {
		if (!isChromeExt) {
			viewState = { kind: "error", message: "Доступно только внутри расширения" };
			return;
		}
		// Каталог уже загружен — не перезагружаем при возврате на вкладку.
		if (projectSearch.catalogLoaded) {
			viewState = { kind: "ready" };
			return;
		}
		viewState = { kind: "loading" };
		try {
			const data = await send<{ projectId: number; name: string; kind?: ProjectKind }[]>(
				"api:projects:catalog",
			);
			projectSearch.catalog = Array.isArray(data) ? data : [];
			projectSearch.catalogLoaded = true;
			viewState = { kind: "ready" };
			logInfo(`project catalog loaded: ${projectSearch.catalog.length}`, "projects");
		} catch (err) {
			projectSearch.catalogError = formatError(err);
			viewState = { kind: "error", message: formatError(err) };
			logError(`project catalog: ${formatError(err)}`, "projects");
		}
	}

	onMount(() => {
		void loadCatalog();
	});

	function projectUrl(e: { projectId: number; kind?: ProjectKind }): string {
		if (e.kind === "course") return `${S21_PLATFORM_ORIGIN}/course/${e.projectId}/`;
		return `${S21_PLATFORM_ORIGIN}${S21_PLATFORM_ROUTES.project(e.projectId)}/about`;
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Поиск по названию / ID -->
	<div class="relative">
		<div class="relative">
			<Icon
				name="search"
				size={14}
				class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
			/>
			<input
				bind:value={projectSearch.query}
				type="text"
				placeholder="Название, ID или ссылка на проект/курс…"
				autocomplete="off"
				class="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-24 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
				oninput={() => (projectSearch.dropdownOpen = true)}
				onkeydown={(e) => {
					if (e.key === "Enter") {
						if (parseRef(projectSearch.query)) {
							void selectFromUrl();
						} else {
							selectId();
							if (hits().length === 1) choose(hits()[0]);
						}
					}
				}}
			/>
			{#if projectSearch.selected}
				<button
					onclick={clearSelection}
					class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
					title="Сбросить выбор"
				>
					Сброс
				</button>
			{/if}
		</div>

		{#if projectSearch.dropdownOpen && hits().length > 0}
			<ul
				class="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
			>
				{#each hits() as entry (entry.projectId)}
					<li>
						<button
							onclick={() => choose(entry)}
							class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
						>
							<span class="truncate font-medium text-slate-700 dark:text-slate-200">
								{entry.name}
							</span>
							<span class="shrink-0 text-[10px] text-slate-400"
								>#{entry.projectId}</span
							>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Найти по ссылке с текущей активной вкладки -->
	<div class="flex items-center gap-2">
		<button
			onclick={() => void parseFromActiveTab()}
			class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
			title="Найти проект или курс по ссылке на текущей вкладке и подставить правильное название"
		>
			<Icon name="link" size={12} />
			По ссылке с вкладки
		</button>
	</div>

	{#if viewState.kind === "loading"}
		<p class="animate-pulse text-xs text-slate-400">Ищем проект в адресе вкладки…</p>
	{:else if viewState.kind === "error"}
		<p
			class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
		>
			{viewState.message}
		</p>
	{:else if viewState.kind === "ready" && !projectSearch.catalog.length}
		<p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50">
			Каталог проектов пуст.
		</p>
	{/if}

	<!-- Выбранный проект или курс -->
	{#if projectSearch.selected}
		<div class="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
			<div class="flex items-center justify-between gap-2">
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
						{projectSearch.selected.name}
					</p>
					<p class="text-[10px] text-slate-400">
						{projectSearch.selected.kind === "course" ? "Курс" : "Проект"} #
						{projectSearch.selected.projectId}
					</p>
				</div>
				<a
					href={projectUrl(projectSearch.selected)}
					target="_blank"
					rel="noopener noreferrer"
					class="flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					title="Открыть на платформе"
				>
					<Icon name="externalLink" size={12} />
					Открыть
				</a>
			</div>
		</div>

		{#if projectSearch.selected.kind === "course"}
			<!-- Проекты внутри курса -->
			<div class="flex flex-col gap-1.5">
				<p
					class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
				>
					Проекты курса
				</p>
				{#if projectSearch.courseProjectsLoading && !projectSearch.courseProjects.length}
					<p class="animate-pulse text-xs text-slate-400">Загружаем проекты курса…</p>
				{:else if projectSearch.courseProjectsError && !projectSearch.courseProjects.length}
					<p
						class="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
					>
						{projectSearch.courseProjectsError}
					</p>
				{:else if !projectSearch.courseProjects.length}
					<p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-slate-800/50">
						В курсе не найдено проектов.
					</p>
				{:else}
					{#each projectSearch.courseProjects as p (p.projectId)}
						<button
							onclick={() => openCourseProject(p)}
							class="group flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-500"
							title="Открыть статистику проекта"
						>
							<span
								class="truncate font-mono text-xs font-medium text-slate-700 dark:text-slate-200"
							>
								{p.name}
							</span>
							<span
								class="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-blue-600 group-hover:underline dark:text-blue-400"
							>
								<Icon name="externalLink" size={10} />
								Статистика
							</span>
						</button>
					{/each}
				{/if}
			</div>
		{:else}
			<!-- Открытый из курса проект: возврат к списку -->
			{#if projectSearch.courseContext}
				<button
					onclick={() => void goBackToCourse()}
					class="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
					title="Вернуться к списку проектов курса"
				>
					<Icon name="chevronLeft" size={12} />
					← {projectSearch.courseContext.name}
				</button>
			{/if}

			<!-- Категории участников -->
			{#key projectSearch.selected.projectId + projectSearch.categories.length}
				<div class="flex flex-col gap-2">
					{#each projectSearch.categories as cat (cat.status)}
						<ProjectCategory
							status={cat.status}
							label={cat.label}
							dotClass={cat.dotClass}
						/>
					{/each}
				</div>
			{/key}
		{/if}
	{:else}
		<p class="text-[11px] text-slate-400">
			Начните печатать название проекта или нажмите «По ссылке с вкладки», чтобы увидеть
			участников.
		</p>
	{/if}
</div>
