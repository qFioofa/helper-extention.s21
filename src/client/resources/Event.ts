import type { EventsParams, EventsV1DTO } from "../../types";
import { Resource } from "./Resource";

export class EventResource extends Resource {
	/** Returns events. */
	getEvents(params: EventsParams): Promise<EventsV1DTO> {
		return this.http.get<EventsV1DTO>("/v1/events", { query: params });
	}
}
