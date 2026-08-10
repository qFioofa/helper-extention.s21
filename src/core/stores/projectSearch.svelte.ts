import type { ProjectKind, ProjectParticipantSummary } from "../../api/project";

const MESSAGE_TIMEOUT_MS = 25_000;
export const PROJECTS_PAGE_SIZE = 50;

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

/** Shorthand-отправка сообщения в background-воркер расширения. */
async function send<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
	const res = await withTimeout(
		chrome.runtime.sendMessage({ type, ...payload }),
		MESSAGE_TIMEOUT_MS,
	);
	if (res?.error) throw res.error;
	return res?.data as T;
}

/** Найденные проекты по запросу (каталог / результат). */
export interface ProjectHit {
	projectId: number;
	name: string;
	kind?: ProjectKind;
}

export interface ProjectStatusMeta {
	status: string;
	label: string;
	dot: string;
}

export interface ProjectCategoryState {
	status: string;
	label: string;
	dotClass: string;
	expanded: boolean;
	logins: string[];
	participants: (ProjectParticipantSummary | null)[];
	hasMore: boolean;
	loadingLogins: boolean;
	loadingDetails: boolean;
	statLoaded: boolean;
	error: string;
}

/** Порядок категорий: приоритетные (на проверке, в процессе, принят, записан) первыми, остальные — следом. */
export const PROJECT_STATUS_ORDER: ProjectStatusMeta[] = [
	{ status: "IN_REVIEWS", label: "На проверке", dot: "bg-amber-500" },
	{ status: "IN_PROGRESS", label: "В процессе", dot: "bg-violet-500" },
	{ status: "ACCEPTED", label: "Принят", dot: "bg-emerald-500" },
	{ status: "REGISTERED", label: "Записан", dot: "bg-blue-500" },
	{ status: "ASSIGNED", label: "Назначен", dot: "bg-slate-400" },
	{ status: "FAILED", label: "Провален", dot: "bg-rose-500" },
];

function createCategory(meta: ProjectStatusMeta): ProjectCategoryState {
	return {
		status: meta.status,
		label: meta.label,
		dotClass: meta.dot,
		expanded: false,
		logins: [],
		participants: [],
		hasMore: false,
		loadingLogins: false,
		loadingDetails: false,
		statLoaded: false,
		error: "",
	};
}

/**
 * Состояние поиска по проектам. Держим его здесь, вне компонентов, чтобы
 * результат запроса (выбранный проект и уже загруженные категории) сохранялся
 * при переходах между вкладками расширения.
 */
export const projectSearch = $state({
	query: "",
	selected: null as ProjectHit | null,
	dropdownOpen: false,
	catalog: [] as ProjectHit[],
	catalogLoaded: false,
	catalogError: "",
	categories: PROJECT_STATUS_ORDER.map(createCategory) as ProjectCategoryState[],
	// Проекты внутри выбранного курса.
	courseProjects: [] as ProjectHit[],
	courseProjectsLoading: false,
	courseProjectsError: "",
	// Открытый из курса проект, чтобы можно было вернуться к списку.
	courseContext: null as { courseId: number; name: string } | null,
});

export function resetCategories() {
	projectSearch.categories = PROJECT_STATUS_ORDER.map(createCategory);
}

export function resetSelection() {
	projectSearch.selected = null;
	projectSearch.query = "";
	projectSearch.dropdownOpen = false;
	projectSearch.courseProjects = [];
	projectSearch.courseProjectsLoading = false;
	projectSearch.courseProjectsError = "";
	projectSearch.courseContext = null;
	resetCategories();
}

/** Загружает проекты выбранного курса (если выбран именно курс). */
export async function loadCourseProjects() {
	const selected = projectSearch.selected;
	if (!selected || selected.kind !== "course") {
		projectSearch.courseProjects = [];
		projectSearch.courseProjectsError = "";
		return;
	}
	projectSearch.courseProjectsLoading = true;
	projectSearch.courseProjectsError = "";
	try {
		const data = await send<ProjectHit[]>("api:course:projects", {
			courseId: selected.projectId,
		});
		projectSearch.courseProjects = Array.isArray(data) ? data : [];
	} catch (err) {
		projectSearch.courseProjectsError = formatError(err);
	} finally {
		projectSearch.courseProjectsLoading = false;
	}
}

export function getCategory(status: string): ProjectCategoryState | undefined {
	return projectSearch.categories.find((c) => c.status === status);
}

export function ensureCategory(status: string): ProjectCategoryState {
	let cat = getCategory(status);
	if (!cat) {
		const meta = PROJECT_STATUS_ORDER.find((m) => m.status === status);
		cat = createCategory(meta ?? { status, label: status, dot: "bg-slate-400" });
		projectSearch.categories = [...projectSearch.categories, cat];
	}
	return cat;
}

/** Загружает первую страницу участников для категории (для счётчика в шапке). */
export async function loadStatusStat(status: string) {
	const cat = ensureCategory(status);
	if (cat.statLoaded || cat.loadingLogins) return;
	cat.loadingLogins = true;
	cat.error = "";
	try {
		const projectId = projectSearch.selected?.projectId;
		if (!projectId) return;
		const { logins } = await send<{ logins: string[] }>("api:project:participants", {
			projectId,
			status,
			limit: PROJECTS_PAGE_SIZE,
			offset: 0,
		});
		cat.logins = logins;
		cat.hasMore = logins.length === PROJECTS_PAGE_SIZE;
		cat.statLoaded = true;
	} catch (err) {
		cat.error = formatError(err);
	} finally {
		cat.loadingLogins = false;
	}
}

/** Загружает детали участников для развёрнутой категории. */
export async function populateStatus(status: string) {
	const cat = ensureCategory(status);
	if (!cat.statLoaded) await loadStatusStat(status);
	if (cat.loadingDetails || cat.participants.length || !cat.logins.length) return;
	cat.loadingDetails = true;
	cat.error = "";
	try {
		const data = await send<(ProjectParticipantSummary | null)[]>("api:project:participant-details", {
			logins: cat.logins,
		});
		cat.participants = data ?? [];
	} catch (err) {
		cat.error = formatError(err);
	} finally {
		cat.loadingDetails = false;
	}
}

/** Загружает следующую страницу участников для категории. */
export async function loadMoreStatus(status: string) {
	const cat = ensureCategory(status);
	if (cat.loadingLogins || cat.loadingDetails || !cat.hasMore) return;
	cat.loadingLogins = true;
	cat.error = "";
	try {
		const projectId = projectSearch.selected?.projectId;
		if (!projectId) return;
		const { logins: next } = await send<{ logins: string[] }>("api:project:participants", {
			projectId,
			status,
			limit: PROJECTS_PAGE_SIZE,
		offset: cat.logins.length,
		});
		cat.hasMore = next.length === PROJECTS_PAGE_SIZE;
		if (next.length) {
			cat.logins = [...cat.logins, ...next];
			const details = await send<(ProjectParticipantSummary | null)[]>("api:project:participant-details", {
				logins: next,
			});
			cat.participants = [...cat.participants, ...(details ?? [])];
		}
	} catch (err) {
		cat.error = formatError(err);
	} finally {
		cat.loadingLogins = false;
	}
}
