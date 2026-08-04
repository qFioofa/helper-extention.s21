import type { ConditionRuleGroupV1DTO } from "./project";

/** Course */
export interface CourseV1DTO {
	courseId: number;
	title: string;
	description: string;
	durationHours: number;
	xp: number;
	startConditions?: ConditionRuleGroupV1DTO[];
}
