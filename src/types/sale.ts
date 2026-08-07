export type SaleType = "PRP" | "CRP";
export type SaleStatus = "NON_ACTIVE" | "ACTIVE" | "PLANNED";

/** Sale */
export interface SaleV1DTO {
	type: SaleType;
	status: SaleStatus;
	startDateTime?: string;
	progressPercentage?: number;
}

/** Sales */
export interface SalesV1DTO {
	sales: SaleV1DTO[];
}
