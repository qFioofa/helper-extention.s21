import type {
	ParticipantPointsV1DTO,
	ParticipantProjectV1DTO,
	ParticipantV1DTO,
	ParticipantWorkstationV1DTO,
} from "@s21/api";
import { backgroundClient } from "./client";
import { logWarn } from "../core/logger.svelte";

export type CompletedProject = {
	project: ParticipantProjectV1DTO;
	completedAgo: string;
};

export type FullProfile = {
	participant: ParticipantV1DTO;
	points: ParticipantPointsV1DTO | null;
	workstation: ParticipantWorkstationV1DTO | null;
	inProgress: ParticipantProjectV1DTO[];
	inReviews: ParticipantProjectV1DTO[];
	waitingTeam: ParticipantProjectV1DTO[];
	completed: CompletedProject[];
};

const PROJECTS_LIMIT = 100;

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

/** Групповые проекты, ещё не начатые (ждут сбора команды). */
function isWaitingTeam(p: ParticipantProjectV1DTO): boolean {
	return p.type === "GROUP" && (p.status === "ASSIGNED" || p.status === "REGISTERED");
}

/** Собирает полный профиль пира: базовые данные, очки, место, проекты. */
export async function fetchFullProfile(login: string): Promise<FullProfile> {
	const [participant, points, workstation, projects] = await Promise.all([
		backgroundClient.participant.getByLogin(login),
		backgroundClient.participant.getPoints(login),
		backgroundClient.participant.getWorkstation(login).catch((err) => {
			logWarn(`workstation unavailable for ${login}: ${err}`, "peer");
			return null;
		}),
		backgroundClient.participant.getProjects(login, { limit: PROJECTS_LIMIT }),
	]);

	const inProgress = projects.projects.filter((p) => p.status === "IN_PROGRESS");
	const inReviews = projects.projects.filter((p) => p.status === "IN_REVIEWS");
	const waitingTeam = projects.projects.filter(isWaitingTeam);
	const completed = projects.projects
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
		inProgress,
		inReviews,
		waitingTeam,
		completed,
	};
}
