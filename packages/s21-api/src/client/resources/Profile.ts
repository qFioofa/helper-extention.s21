import { notImplemented } from "../../errors";
import { Resource } from "./Resource";

export class ProfileResource extends Resource {
	getCurrent(): Promise<unknown> {
		return notImplemented("Profile.getCurrent");
	}

	getById(_id: number): Promise<unknown> {
		return notImplemented("Profile.getById");
	}

	updateCurrent(_data: unknown): Promise<unknown> {
		return notImplemented("Profile.updateCurrent");
	}
}
