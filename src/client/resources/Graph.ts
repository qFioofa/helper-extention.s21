import type { GraphV1DTO } from "../../types";
import { Resource } from "./Resource";

export class GraphResource extends Resource {
	/** Returns the graph. */
	getGraph(): Promise<GraphV1DTO> {
		return this.http.get<GraphV1DTO>("/v1/graph");
	}
}
