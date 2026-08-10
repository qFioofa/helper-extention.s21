/** Запрос на поиск пира из другого острова (например, поиска по проектам). */
export const peerSearchRequest = $state<{ nonce: number; login: string }>({ nonce: 0, login: "" });

/**
 * Запрашивает поиск пира из другого острова (например, поиска по проектам).
 * Сам переход на вкладку поиска выполняет ContentArea, который подписан на
 * этот стейт, — так мы не создаём циклическую зависимость
 * (registry -> ProjectSearchPanel -> peerSearch -> category -> registry).
 */
export function requestPeerSearch(login: string) {
	peerSearchRequest.login = login;
	peerSearchRequest.nonce += 1;
}
