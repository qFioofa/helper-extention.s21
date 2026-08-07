import type { CourseV1DTO } from "../../types";
import { Resource } from "./Resource";

export class CourseResource extends Resource {
	/** Returns course information by ID. */
	getById(courseId: number): Promise<CourseV1DTO> {
		return this.http.get<CourseV1DTO>(`/v1/courses/${courseId}`);
	}
}
