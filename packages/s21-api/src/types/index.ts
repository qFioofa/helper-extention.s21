export interface S21User {
	id: number;
	login: string;
}

export interface S21Project {
	id: number;
	name: string;
}

export interface S21PeerReview {
	id: number;
	reviewerId: number;
	revieweeId: number;
}

export interface S21PaginationParams {
	page?: number;
	perPage?: number;
}

export interface S21Pagination {
	page: number;
	perPage: number;
	total: number;
}
