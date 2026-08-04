import { notImplemented } from "../../errors";
import { Resource } from "./Resource";

export class AuthResource extends Resource {
	login(_login: string, _password: string): Promise<unknown> {
		return notImplemented("Auth.login");
	}

	logout(): Promise<unknown> {
		return notImplemented("Auth.logout");
	}

	me(): Promise<unknown> {
		return notImplemented("Auth.me");
	}

	refreshToken(): Promise<unknown> {
		return notImplemented("Auth.refreshToken");
	}
}
