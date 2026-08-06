import { categories } from "../registry";

export const activeCategoryId = $state({ value: categories[0].id });

export function selectCategory(id: string) {
	activeCategoryId.value = id;
}
