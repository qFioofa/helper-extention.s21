import { S21Client, S21_API_BASE_URL } from "@s21/api";

// Единый клиент для фоновых запросов (background/попсловы).
export const backgroundClient = new S21Client({
	baseUrl: S21_API_BASE_URL,
	credentials: "include",
});