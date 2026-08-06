export type ProjectStatus =
	"ASSIGNED" | "REGISTERED" | "IN_PROGRESS" | "IN_REVIEWS" | "ACCEPTED" | "FAILED";
export type ProjectType = "INDIVIDUAL" | "GROUP" | "EXAM" | "EXAM_TEST" | "INTERNSHIP";
export type LogicalOperator = "OR" | "AND";

/** Array of condition values */
export interface ConditionValueValueV1DTO {
	key: string;
	value?: string;
}

/**
 * A condition object that contains information about the parameter to be evaluated
 * and the value being checked.
 */
export interface ConditionRuleValueV1DTO {
	fieldId: number;
	fieldName: string;
	subFieldKey?: string;
	subFieldValue?: string;
	operator: string;
	value: ConditionValueValueV1DTO[];
}

/** Condition in the condition group */
export interface ConditionRuleV1DTO {
	logicalOperator?: LogicalOperator;
	value: ConditionRuleValueV1DTO;
}

/**
 * A system of conditions for project completion, organized into groups that are
 * combined using logical operators (AND or OR). Conditions within each group can
 * also be linked by these operators. Each condition evaluates a parameter
 * (like XP or project status) using comparison operators (IN, =, >, <).
 */
export interface ConditionRuleGroupV1DTO {
	logicalOperator?: LogicalOperator;
	rulesInGroup: ConditionRuleV1DTO[];
}

/** Project */
export interface ProjectV1DTO {
	projectId: number;
	title: string;
	description: string;
	durationHours: number;
	xp?: number;
	type: ProjectType;
	startConditions?: ConditionRuleGroupV1DTO[];
	courseId?: number;
}

/** Participant logins */
export interface ParticipantLoginsV1DTO {
	participants: string[];
}

/** Team Member */
export interface TeamMemberV1DTO {
	login: string;
	isTeamlead: boolean;
}

/** Participant Project */
export interface ParticipantProjectV1DTO {
	id: number;
	title: string;
	type: ProjectType;
	status: ProjectStatus;
	finalPercentage?: number;
	completionDateTime?: string;
	teamMembers?: TeamMemberV1DTO[];
	courseId?: number;
}

/** Participant Projects */
export interface ParticipantProjectsV1DTO {
	projects: ParticipantProjectV1DTO[];
}
