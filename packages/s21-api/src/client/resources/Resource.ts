import type { HttpTransport } from "../../transport/http";

export abstract class Resource {
	protected readonly http: HttpTransport;

	constructor(http: HttpTransport) {
		this.http = http;
	}
}
