import type {
	ParticipantBadgesV1DTO,
	ParticipantCoalitionV1DTO,
	ParticipantCourseV1DTO,
	ParticipantCoursesParams,
	ParticipantCoursesV1DTO,
	ParticipantFeedbackV1DTO,
	ParticipantLogtimeParams,
	ParticipantPointsV1DTO,
	ParticipantProjectV1DTO,
	ParticipantProjectsParams,
	ParticipantProjectsV1DTO,
	ParticipantSkillsV1DTO,
	ParticipantV1DTO,
	ParticipantWorkstationV1DTO,
	ParticipantXpHistoryParams,
	ParticipantXpHistoryV1DTO,
} from "../../types";
import { Resource } from "./Resource";

export class ParticipantResource extends Resource {
	/** Returns participant information by login. */
	getByLogin(login: string): Promise<ParticipantV1DTO> {
		return this.http.get<ParticipantV1DTO>(`/v1/participants/${login}`);
	}

	/** Returns participant workstation by login. */
	getWorkstation(login: string): Promise<ParticipantWorkstationV1DTO> {
		return this.http.get<ParticipantWorkstationV1DTO>(`/v1/participants/${login}/workstation`);
	}

	/** Returns participant skills by login. */
	getSkills(login: string): Promise<ParticipantSkillsV1DTO> {
		return this.http.get<ParticipantSkillsV1DTO>(`/v1/participants/${login}/skills`);
	}

	/** Returns participant projects by login. */
	getProjects(login: string, params?: ParticipantProjectsParams): Promise<ParticipantProjectsV1DTO> {
		return this.http.get<ParticipantProjectsV1DTO>(`/v1/participants/${login}/projects`, { query: params });
	}

	/** Returns participant project by login and project ID. */
	getProject(login: string, projectId: number): Promise<ParticipantProjectV1DTO> {
		return this.http.get<ParticipantProjectV1DTO>(`/v1/participants/${login}/projects/${projectId}`);
	}

	/** Returns participant points by login. */
	getPoints(login: string): Promise<ParticipantPointsV1DTO> {
		return this.http.get<ParticipantPointsV1DTO>(`/v1/participants/${login}/points`);
	}

	/** Returns weekly average logtime hours by login and date. */
	getLogtime(login: string, params?: ParticipantLogtimeParams): Promise<number> {
		return this.http.get<number>(`/v1/participants/${login}/logtime`, { query: params });
	}

	/** Returns participant feedback by login. */
	getFeedback(login: string): Promise<ParticipantFeedbackV1DTO> {
		return this.http.get<ParticipantFeedbackV1DTO>(`/v1/participants/${login}/feedback`);
	}

	/** Returns participant XP history by login. */
	getXpHistory(login: string, params?: ParticipantXpHistoryParams): Promise<ParticipantXpHistoryV1DTO> {
		return this.http.get<ParticipantXpHistoryV1DTO>(`/v1/participants/${login}/experience-history`, { query: params });
	}

	/** Returns participant courses by login. */
	getCourses(login: string, params?: ParticipantCoursesParams): Promise<ParticipantCoursesV1DTO> {
		return this.http.get<ParticipantCoursesV1DTO>(`/v1/participants/${login}/courses`, { query: params });
	}

	/** Returns participant course by login and course ID. */
	getCourse(login: string, courseId: number): Promise<ParticipantCourseV1DTO> {
		return this.http.get<ParticipantCourseV1DTO>(`/v1/participants/${login}/courses/${courseId}`);
	}

	/** Returns participant coalition by login. */
	getCoalition(login: string): Promise<ParticipantCoalitionV1DTO> {
		return this.http.get<ParticipantCoalitionV1DTO>(`/v1/participants/${login}/coalition`);
	}

	/** Returns participant badges by login. */
	getBadges(login: string): Promise<ParticipantBadgesV1DTO> {
		return this.http.get<ParticipantBadgesV1DTO>(`/v1/participants/${login}/badges`);
	}
}
