export class S21ApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "S21ApiError";
	}
}

export class S21HttpError extends S21ApiError {
	constructor(
		readonly status: number,
		readonly statusText: string,
		readonly body: unknown,
	) {
		super(`S21 API request failed with status ${status} (${statusText})`);
		this.name = "S21HttpError";
	}
}
