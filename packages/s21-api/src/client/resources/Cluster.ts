import type { ClusterMapParams, ClusterMapV1DTO } from "../../types";
import { Resource } from "./Resource";

export class ClusterResource extends Resource {
	/** Returns cluster map. */
	getMap(clusterId: number, params?: ClusterMapParams): Promise<ClusterMapV1DTO> {
		return this.http.get<ClusterMapV1DTO>(`/v1/clusters/${clusterId}/map`, { query: params });
	}
}
