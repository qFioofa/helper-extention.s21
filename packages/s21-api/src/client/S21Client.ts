import { HttpTransport } from "../transport/http";
import type { HttpTransportOptions } from "../transport/http";
import { AuthResource, ProfileResource, ProjectsResource, PeerReviewsResource } from "./resources";

export type S21ClientOptions = Omit<HttpTransportOptions, "baseUrl"> & {
	baseUrl: string;
};

export class S21Client {
	readonly transport: HttpTransport;
	readonly auth: AuthResource;
	readonly profile: ProfileResource;
	readonly projects: ProjectsResource;
	readonly peerReviews: PeerReviewsResource;

	constructor(options: S21ClientOptions) {
		this.transport = new HttpTransport(options);
		this.auth = new AuthResource(this.transport);
		this.profile = new ProfileResource(this.transport);
		this.projects = new ProjectsResource(this.transport);
		this.peerReviews = new PeerReviewsResource(this.transport);
	}
}
