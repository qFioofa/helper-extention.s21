import type { CourseV1DTO, ParticipantV1DTO, ProjectV1DTO } from "@qfioofa/s21-api";
import { backgroundClient } from "./client";
import { logWarn } from "../core/logger.svelte";

/** Элемент каталога проектов (строится из graph-эндпоинта). */
export interface ProjectCatalogEntry {
	projectId: number;
	name: string;
	kind: ProjectKind;
}

export type ProjectKind = "project" | "course";

/** Краткая карточка участника проекта. */
export interface ProjectParticipantSummary {
	login: string;
	className?: string;
	parallelName?: string;
	campus: { id: string; shortName: string } | null;
	status?: string;
	level?: number;
	expValue?: number;
	avatarUrl: string | null;
}

const CONCURRENCY = 6;

async function mapConcurrent<T, R>(
	items: T[],
	limit: number,
	fn: (item: T) => Promise<R>,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let i = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (i < items.length) {
			const idx = i++;
			results[idx] = await fn(items[idx]);
		}
	});
	await Promise.all(workers);
	return results;
}

/** Собирает каталог всех проектов и курсов из графа обучения. */
export async function fetchProjectCatalog(): Promise<ProjectCatalogEntry[]> {
	const graph = await backgroundClient.graph.getGraph();
	const byId = new Map<number, ProjectCatalogEntry>();
	for (const node of graph.nodes ?? []) {
		for (const item of node.items ?? []) {
			if (item.entityType !== "PROJECT" && item.entityType !== "COURSE") continue;
			if (item.entityId == null) continue;
			const kind: ProjectKind = item.entityType === "COURSE" ? "course" : "project";
			const name = item.code?.trim() || node.label?.trim() || `#${item.entityId}`;
			if (!byId.has(item.entityId)) {
				byId.set(item.entityId, { projectId: item.entityId, name, kind });
			}
		}
	}
	return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Информация о проекте по ID. */
export async function fetchProject(projectId: number): Promise<ProjectV1DTO> {
	return backgroundClient.project.getById(projectId);
}

/** Информация о курсе по ID. */
export async function fetchCourse(courseId: number): Promise<CourseV1DTO> {
	return backgroundClient.course.getById(courseId);
}

/** Проекты, входящие в курс: обходим граф от узла курса вниз по рёбрам. */
export async function fetchCourseProjects(courseId: number): Promise<ProjectCatalogEntry[]> {
	const graph = await backgroundClient.graph.getGraph();
	const nodeById = new Map<string, { items: GraphNodeItemView[] }>();
	for (const node of graph.nodes ?? []) {
		const items: GraphNodeItemView[] = [];
		for (const item of node.items ?? []) {
			items.push({
				entityType: item.entityType,
				entityId: item.entityId ?? null,
				code: item.code ?? "",
				label: node.label ?? "",
			});
		}
		nodeById.set(node.id, { items });
	}

	const roots = new Set<string>();
	for (const [nodeId, view] of nodeById) {
		if (view.items.some((it) => it.entityType === "COURSE" && it.entityId === courseId)) {
			roots.add(nodeId);
		}
	}
	if (!roots.size) return [];

	const children = new Map<string, string[]>();
	for (const edge of graph.edges ?? []) {
		if (!children.has(edge.source)) children.set(edge.source, []);
		children.get(edge.source)!.push(edge.target);
	}

	const visited = new Set<string>(roots);
	const stack = [...roots];
	const byId = new Map<number, ProjectCatalogEntry>();
	while (stack.length) {
		const nodeId = stack.pop()!;
		for (const childId of children.get(nodeId) ?? []) {
			if (visited.has(childId)) continue;
			visited.add(childId);
			for (const item of nodeById.get(childId)?.items ?? []) {
				if (item.entityType !== "PROJECT" || item.entityId == null) continue;
				if (!byId.has(item.entityId)) {
					const name = item.code?.trim() || item.label?.trim() || `#${item.entityId}`;
					byId.set(item.entityId, { projectId: item.entityId, name, kind: "project" });
				}
			}
			stack.push(childId);
		}
	}
	return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

type GraphNodeItemView = {
	entityType: "PROJECT" | "COURSE";
	entityId: number | null;
	code: string;
	label: string;
};

function toAvatarUrl(p: ParticipantV1DTO): string | null {
	const raw = p as unknown as { avatarUrl?: unknown; avatar?: unknown };
	const v = raw?.avatarUrl ?? raw?.avatar;
	return typeof v === "string" && v ? v : null;
}

/** Подтягивает детали участников по логинам (батчами с ограничением параллелизма). */
export async function fetchParticipantDetails(
	logins: string[],
): Promise<(ProjectParticipantSummary | null)[]> {
	return mapConcurrent(logins, CONCURRENCY, async (login) => {
		try {
			const p = await backgroundClient.participant.getByLogin(login);
			return {
				login,
				className: p.className,
				parallelName: p.parallelName,
				campus: p.campus ?? null,
				status: p.status,
				level: p.level,
				expValue: p.expValue,
				avatarUrl: toAvatarUrl(p),
			};
		} catch (err) {
			logWarn(`participant ${login} details: ${err}`, "project");
			return null;
		}
	});
}
