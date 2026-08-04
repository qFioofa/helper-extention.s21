import { notImplemented } from "../../errors";
import { Resource } from "./Resource";

export class ProjectsResource extends Resource {
	list(_params?: unknown): Promise<unknown> {
		return notImplemented("Projects.list");
	}

	getById(_id: number): Promise<unknown> {
		return notImplemented("Projects.getById");
	}

	getProgress(_projectId: number): Promise<unknown> {
		return notImplemented("Projects.getProgress");
	}
}
