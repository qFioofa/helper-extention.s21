import type { SalesV1DTO } from "../../types";
import { Resource } from "./Resource";

export class SaleResource extends Resource {
	/** Returns current sales' statuses within parallel. */
	getSales(): Promise<SalesV1DTO> {
		return this.http.get<SalesV1DTO>("/v1/sales");
	}
}
