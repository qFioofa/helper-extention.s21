import type { ParticipantLoginsV1DTO, ProjectParticipantsParams, ProjectV1DTO } from "../../types";
import { Resource } from "./Resource";

export class ProjectResource extends Resource {
	/** Returns project information by ID. */
	getById(projectId: number): Promise<ProjectV1DTO> {
		return this.http.get<ProjectV1DTO>(`/v1/projects/${projectId}`);
	}

	/** Returns participant logins of the project. */
	getParticipants(projectId: number, params?: ProjectParticipantsParams): Promise<ParticipantLoginsV1DTO> {
		return this.http.get<ParticipantLoginsV1DTO>(`/v1/projects/${projectId}/participants`, { query: params });
	}
}
