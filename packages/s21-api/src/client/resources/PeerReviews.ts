import { notImplemented } from "../../errors";
import { Resource } from "./Resource";

export class PeerReviewsResource extends Resource {
	list(_params?: unknown): Promise<unknown> {
		return notImplemented("PeerReviews.list");
	}

	getById(_id: number): Promise<unknown> {
		return notImplemented("PeerReviews.getById");
	}

	submitReview(_id: number, _data: unknown): Promise<unknown> {
		return notImplemented("PeerReviews.submitReview");
	}
}
