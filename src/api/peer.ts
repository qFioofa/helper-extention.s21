import type {
	CourseStatus,
	ParticipantCourseV1DTO,
	ParticipantPointsV1DTO,
	ParticipantProjectV1DTO,
	ParticipantSkillV1DTO,
	ParticipantV1DTO,
	ParticipantWorkstationV1DTO,
} from "@qfioofa/s21-api";
import { backgroundClient } from "./client";
import { logWarn } from "../core/logger.svelte";

export type CompletedProject = {
	project: ParticipantProjectV1DTO;
	completedAgo: string;
};

/** Буткемп (курс) в процессе + внутренние проекты участника из этого курса. */
export type BootcampCourse = {
	id: number;
	title: string;
	status: CourseStatus;
	finalPercentage?: number;
	completionDateTime?: string;
	projects: ParticipantProjectV1DTO[];
};

export type FullProfile = {
	participant: ParticipantV1DTO;
	points: ParticipantPointsV1DTO | null;
	workstation: ParticipantWorkstationV1DTO | null;
	skills: ParticipantSkillV1DTO[];
	inReviews: ParticipantProjectV1DTO[];
	waitingTeam: ParticipantProjectV1DTO[];
	inProgress: ParticipantProjectV1DTO[];
	bootcamps: BootcampCourse[];
	assigned: ParticipantProjectV1DTO[];
	completed: CompletedProject[];
};

/** Человекочитаемые названия статусов проекта. */
export const PROJECT_STATUS_LABEL: Record<string, string> = {
	ASSIGNED: "Назначен",
	REGISTERED: "Зарегистрирован",
	IN_PROGRESS: "В процессе",
	IN_REVIEW: "На проверке",
	IN_REVIEWS: "На проверке",
	ACCEPTED: "Принят",
	FAILED: "Провален",
};

// Максимум по спецификации API — мелкий лимит отрезает активные проекты
// (на ревью, записанные групповые) за пределами первых N ответов.
const PROJECTS_LIMIT = 1000;
const COURSES_TIMEOUT_MS = 5_000;

/** Ограничивает время ожидания: если запрос висит дольше — отдаём fallback. */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: () => T): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error("timeout")), ms);
			}),
		]);
	} catch (err) {
		logWarn(`withTimeout: ${err}`, "peer");
		return fallback();
	} finally {
		if (timer) clearTimeout(timer);
	}
}

/** Формирует «сколько времени прошло» на русском. */
export function formatAgo(dateTime: string, now = Date.now()): string {
	const ts = new Date(dateTime).getTime();
	if (!Number.isFinite(ts)) return "—";
	const diff = Math.max(0, now - ts);
	const min = Math.floor(diff / 60_000);
	if (min < 1) return "только что";
	if (min < 60) return plural(min, "минуту", "минуты", "минут");
	const hours = Math.floor(min / 60);
	if (hours < 24) return plural(hours, "час", "часа", "часов");
	const days = Math.floor(hours / 24);
	return plural(days, "день", "дня", "дней");
}

function plural(n: number, one: string, few: string, many: string): string {
	const abs = Math.abs(n) % 100;
	const last = abs % 10;
	if (abs > 10 && abs < 20) return `${n} ${many} назад`;
	if (last > 1 && last < 5) return `${n} ${few} назад`;
	if (last === 1) return `${n} ${one} назад`;
	return `${n} ${many} назад`;
}

/** Экзамены (в т.ч. пробные). */
function isExam(p: ParticipantProjectV1DTO): boolean {
	return p.type === "EXAM" || p.type === "EXAM_TEST";
}

/** Проект записан/зарегистрирован самим пиром. Статус ASSIGNED — «назначен, но не записан» — не считаем активным. */
function isRegistered(p: ParticipantProjectV1DTO): boolean {
	return p.status === "REGISTERED";
}

/** Групповые проекты, на которые пир записан (REGISTERED) и которые ещё собирают команду. */
function isWaitingTeam(p: ParticipantProjectV1DTO): boolean {
	return p.type === "GROUP" && isRegistered(p);
}

/** Проект на проверке: ловим и IN_REVIEWS, и возможные вариации статуса. */
function isInReviews(p: ParticipantProjectV1DTO): boolean {
	return (p.status ?? "").toUpperCase().includes("REVIEW");
}

/** Собирает полный профиль пира: базовые данные, очки, место, проекты. */
export async function fetchFullProfile(login: string): Promise<FullProfile> {
	const [participant, points, workstation, projects, skills, courses] = await Promise.all([
		backgroundClient.participant.getByLogin(login),
		backgroundClient.participant.getPoints(login),
		backgroundClient.participant.getWorkstation(login).catch((err) => {
			logWarn(`workstation unavailable for ${login}: ${err}`, "peer");
			return null;
		}),
		backgroundClient.participant.getProjects(login, { limit: PROJECTS_LIMIT }),
		backgroundClient.participant.getSkills(login).catch((err) => {
			logWarn(`skills unavailable for ${login}: ${err}`, "peer");
			return { skills: [] as ParticipantSkillV1DTO[] };
		}),
		withTimeout(
			backgroundClient.participant.getCourses(login, { status: "IN_PROGRESS" }),
			COURSES_TIMEOUT_MS,
			() => ({ courses: [] as ParticipantCourseV1DTO[] }),
		),
	]);

	const allProjects = projects.projects ?? [];
	const skillsList = skills.skills ?? [];
	const bootcamps = (courses.courses ?? []).map((c: ParticipantCourseV1DTO) => ({
		id: c.id,
		title: c.title,
		status: c.status,
		finalPercentage: c.finalPercentage,
		completionDateTime: c.completionDateTime,
		projects: allProjects.filter(
			(p) =>
				p.courseId != null &&
				p.courseId === c.id &&
				// «Назначенные» (но не записанные) проекты курса не показываем.
				p.status !== "ASSIGNED",
		),
	}));

	const examIds = new Set(allProjects.filter(isExam).map((p) => p.id));
	const noExam = allProjects.filter((p) => !examIds.has(p.id));

	const inReviews = noExam.filter(isInReviews);
	const waitingTeam = noExam.filter(isWaitingTeam);
	const inProgress = noExam.filter((p) => p.status === "IN_PROGRESS");
	const assigned = noExam.filter((p) => isRegistered(p) && p.type !== "GROUP");
	const completed = noExam
		.filter((p) => p.status === "ACCEPTED" && !!p.completionDateTime)
		.sort(
			(a, b) =>
				new Date(b.completionDateTime as string).getTime() -
				new Date(a.completionDateTime as string).getTime(),
		)
		.slice(0, 3)
		.map((project) => ({
			project,
			completedAgo: formatAgo(project.completionDateTime as string),
		}));

	return {
		participant,
		points,
		workstation,
		skills: skillsList,
		inReviews,
		waitingTeam,
		inProgress,
		bootcamps,
		assigned,
		completed,
	};
}