import type {
	CampusCoalitionsParams,
	CampusParticipantsParams,
	CampusesV1DTO,
	ClustersV1DTO,
	CoalitionsV1DTO,
	ParticipantLoginsV1DTO,
} from "../../types";
import { Resource } from "./Resource";

export class CampusResource extends Resource {
	/** Returns all campuses. */
	getCampuses(): Promise<CampusesV1DTO> {
		return this.http.get<CampusesV1DTO>("/v1/campuses");
	}

	/** Returns participant logins of the campus. */
	getParticipants(campusId: string, params?: CampusParticipantsParams): Promise<ParticipantLoginsV1DTO> {
		return this.http.get<ParticipantLoginsV1DTO>(`/v1/campuses/${campusId}/participants`, { query: params });
	}

	/** Returns coalitions of the campus. */
	getCoalitions(campusId: string, params?: CampusCoalitionsParams): Promise<CoalitionsV1DTO> {
		return this.http.get<CoalitionsV1DTO>(`/v1/campuses/${campusId}/coalitions`, { query: params });
	}

	/** Returns clusters of the campus. */
	getClusters(campusId: string): Promise<ClustersV1DTO> {
		return this.http.get<ClustersV1DTO>(`/v1/campuses/${campusId}/clusters`);
	}
}
