import { HttpTransport } from "../transport/http";
import type { HttpTransportOptions } from "../transport/http";
import {
	CampusResource,
	ClusterResource,
	CoalitionResource,
	CourseResource,
	EventResource,
	GraphResource,
	ParticipantResource,
	ProjectResource,
	SaleResource,
} from "./resources";

export type S21ClientOptions = Omit<HttpTransportOptions, "baseUrl"> & {
	baseUrl: string;
};

export class S21Client {
	readonly transport: HttpTransport;
	readonly campus: CampusResource;
	readonly cluster: ClusterResource;
	readonly coalition: CoalitionResource;
	readonly course: CourseResource;
	readonly event: EventResource;
	readonly graph: GraphResource;
	readonly participant: ParticipantResource;
	readonly project: ProjectResource;
	readonly sale: SaleResource;

	constructor(options: S21ClientOptions) {
		this.transport = new HttpTransport(options);
		this.campus = new CampusResource(this.transport);
		this.cluster = new ClusterResource(this.transport);
		this.coalition = new CoalitionResource(this.transport);
		this.course = new CourseResource(this.transport);
		this.event = new EventResource(this.transport);
		this.graph = new GraphResource(this.transport);
		this.participant = new ParticipantResource(this.transport);
		this.project = new ProjectResource(this.transport);
		this.sale = new SaleResource(this.transport);
	}
}
