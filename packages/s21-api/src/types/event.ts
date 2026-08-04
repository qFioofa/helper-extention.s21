export type EventType = "ACTIVITY" | "EXAM" | "TEST";

/** Event */
export interface EventV1DTO {
	id: number;
	type: string;
	name: string;
	description?: string;
	location: string;
	startDateTime: string;
	endDateTime: string;
	organizers?: string[];
	capacity: number;
	registerCount: number;
}

/** Events */
export interface EventsV1DTO {
	events: EventV1DTO[];
}
