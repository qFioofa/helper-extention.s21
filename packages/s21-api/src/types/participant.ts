export type ParticipantStatus =
	"ACTIVE" | "TEMPORARY_BLOCKING" | "EXPELLED" | "BLOCKED" | "FROZEN" | "STUDY_COMPLETED";
export type CourseStatus = "ASSIGNED" | "REGISTERED" | "IN_PROGRESS" | "ACCEPTED" | "FAILED";

/** Participant Campus */
export interface ParticipantCampusV1DTO {
	id: string;
	shortName: string;
}

/** Participant */
export interface ParticipantV1DTO {
	login: string;
	className?: string;
	parallelName?: string;
	expValue: number;
	level: number;
	expToNextLevel: number;
	campus: ParticipantCampusV1DTO;
	status: ParticipantStatus;
}

/** Participant Workstation */
export interface ParticipantWorkstationV1DTO {
	clusterId: number;
	clusterName: string;
	row: string;
	number: number;
}

/** Participant Skill */
export interface ParticipantSkillV1DTO {
	name: string;
	points: number;
}

/** Participant Skills */
export interface ParticipantSkillsV1DTO {
	skills: ParticipantSkillV1DTO[];
}

/** Participant Points */
export interface ParticipantPointsV1DTO {
	peerReviewPoints: number;
	codeReviewPoints: number;
	coins: number;
}

/** Participant Feedback */
export interface ParticipantFeedbackV1DTO {
	averageVerifierPunctuality?: number;
	averageVerifierInterest?: number;
	averageVerifierThoroughness?: number;
	averageVerifierFriendliness?: number;
}

/** Xp History Item */
export interface ParticipantXpHistoryItemV1DTO {
	expValue: number;
	accrualDateTime: string;
}

/** Xp History */
export interface ParticipantXpHistoryV1DTO {
	expHistory: ParticipantXpHistoryItemV1DTO[];
}

/** Participant Course */
export interface ParticipantCourseV1DTO {
	id: number;
	title: string;
	status: CourseStatus;
	finalPercentage?: number;
	completionDateTime?: string;
}

/** Participant Courses */
export interface ParticipantCoursesV1DTO {
	courses: ParticipantCourseV1DTO[];
}

/** Participant Coalition */
export interface ParticipantCoalitionV1DTO {
	coalitionId: number;
	name: string;
	rank?: number;
}

/** Participant Badge */
export interface ParticipantBadgeV1DTO {
	name: string;
	receiptDateTime: string;
	iconUrl: string;
}

/** Participant Badges */
export interface ParticipantBadgesV1DTO {
	badges: ParticipantBadgeV1DTO[];
}
