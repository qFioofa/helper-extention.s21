import { S21HttpError } from "../errors";

export type QueryValue = string | number | boolean | readonly QueryValue[];

export type QueryObject = Record<string, QueryValue | undefined>;

export interface RequestOptions {
	query?: QueryObject;
	body?: unknown;
	headers?: Record<string, string>;
}

export interface HttpTransportOptions {
	baseUrl: string;
	fetch?: typeof fetch;
	credentials?: RequestCredentials;
	defaultHeaders?: Record<string, string>;
}

export class HttpTransport {
	private readonly baseUrl: string;
	private readonly fetchImpl: typeof fetch;
	private readonly credentials: RequestCredentials;
	private readonly defaultHeaders: Record<string, string>;
	private authToken: string | null = null;

	constructor(options: HttpTransportOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, "");
		this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
		this.credentials = options.credentials ?? "include";
		this.defaultHeaders = { ...options.defaultHeaders };
	}

	setAuthToken(token: string): void {
		this.authToken = token;
	}

	clearAuthToken(): void {
		this.authToken = null;
	}

	get<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("GET", path, options);
	}

	post<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("POST", path, options);
	}

	put<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("PUT", path, options);
	}

	patch<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("PATCH", path, options);
	}

	delete<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("DELETE", path, options);
	}

	private async request<T>(
		method: string,
		path: string,
		options: RequestOptions = {},
	): Promise<T> {
		const url = this.buildUrl(path, options.query);
		const headers = this.buildHeaders(options.headers, options.body);
		const init: RequestInit = {
			method,
			headers,
			credentials: this.credentials,
		};
		if (options.body !== undefined) {
			init.body = JSON.stringify(options.body);
		}

		const response = await this.fetchImpl(url, init);
		const body = await this.parseBody(response);

		if (!response.ok) {
			throw new S21HttpError(response.status, response.statusText, body);
		}

		return body as T;
	}

	private buildUrl(path: string, query?: QueryObject): string {
		const url = new URL(`${this.baseUrl}${path}`);
		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined || value === null) {
					continue;
				}
				if (Array.isArray(value)) {
					for (const item of value) {
						url.searchParams.append(key, String(item));
					}
				} else {
					url.searchParams.set(key, String(value));
				}
			}
		}
		return url.toString();
	}

	private buildHeaders(headers?: Record<string, string>, body?: unknown): Record<string, string> {
		return {
			...this.defaultHeaders,
			...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
			...(body !== undefined ? { "Content-Type": "application/json" } : {}),
			...headers,
		};
	}

	private async parseBody(response: Response): Promise<unknown> {
		const text = await response.text();
		if (!text) {
			return undefined;
		}
		const contentType = response.headers.get("content-type") ?? "";
		if (contentType.includes("application/json")) {
			try {
				return JSON.parse(text) as unknown;
			} catch {
				return text;
			}
		}
		return text;
	}
}
