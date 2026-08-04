import type { CourseStatus, EventType, ProjectStatus } from "./index";

export type ProjectParticipantsParams = {
	limit?: number;
	offset?: number;
	status?: ProjectStatus;
	campusId?: string;
};

export type ParticipantProjectsParams = {
	limit?: number;
	offset?: number;
	status?: ProjectStatus;
};

export type ParticipantLogtimeParams = {
	date?: string;
};

export type ParticipantXpHistoryParams = {
	limit?: number;
	offset?: number;
};

export type ParticipantCoursesParams = {
	limit?: number;
	offset?: number;
	status?: CourseStatus;
};

export type EventsParams = {
	from: string;
	to: string;
	type?: EventType;
	limit?: number;
	offset?: number;
};

export type CoalitionParticipantsParams = {
	limit?: number;
	offset?: number;
};

export type ClusterMapParams = {
	limit?: number;
	offset?: number;
	occupied?: boolean;
};

export type CampusParticipantsParams = {
	limit?: number;
	offset?: number;
};

export type CampusCoalitionsParams = {
	limit?: number;
	offset?: number;
};
