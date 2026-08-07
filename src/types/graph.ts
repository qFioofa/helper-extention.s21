export type GraphEntityType = "PROJECT" | "COURSE";

/** Graph node item */
export interface GraphNodeItemV1DTO {
	id: string;
	code: string;
	handles: string[];
	entityType: GraphEntityType;
	entityId: number;
}

/** Graph node */
export interface GraphNodeV1DTO {
	id: string;
	label: string;
	items: GraphNodeItemV1DTO[];
}

/** Graph edge */
export interface GraphEdgeV1DTO {
	id: string;
	source: string;
	target: string;
	sourceHandle: string;
	targetHandle: string;
}

/** Graph */
export interface GraphV1DTO {
	nodes: GraphNodeV1DTO[];
	edges: GraphEdgeV1DTO[];
}
