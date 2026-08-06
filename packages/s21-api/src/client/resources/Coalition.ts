import type { CoalitionParticipantsParams, ParticipantLoginsV1DTO } from "../../types";
import { Resource } from "./Resource";

export class CoalitionResource extends Resource {
	/** Returns participant logins of the coalition. */
	getParticipants(
		coalitionId: number,
		params?: CoalitionParticipantsParams,
	): Promise<ParticipantLoginsV1DTO> {
		return this.http.get<ParticipantLoginsV1DTO>(`/v1/coalitions/${coalitionId}/participants`, {
			query: params,
		});
	}
}
