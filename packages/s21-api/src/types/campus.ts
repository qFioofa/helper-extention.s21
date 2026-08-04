/** Campus */
export interface CampusV1DTO {
	id: string;
	shortName: string;
	fullName: string;
}

/** Campuses */
export interface CampusesV1DTO {
	campuses: CampusV1DTO[];
}

/** Coalition */
export interface CoalitionV1DTO {
	coalitionId: number;
	name: string;
}

/** Coalitions */
export interface CoalitionsV1DTO {
	coalitions: CoalitionV1DTO[];
}

/** Cluster */
export interface ClusterV1DTO {
	id: number;
	name: string;
	capacity: number;
	availableCapacity: number;
	floor: number;
}

/** Clusters */
export interface ClustersV1DTO {
	clusters: ClusterV1DTO[];
}

/** Workplace */
export interface WorkplaceV1DTO {
	row: string;
	number: number;
	login?: string;
}

/** Cluster map */
export interface ClusterMapV1DTO {
	clusterMap: WorkplaceV1DTO[];
}
