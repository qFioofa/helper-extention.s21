# @s21/api

API-клиент для платформы S21 (School 21). Сгенерирован по OpenAPI-спецификации `swagger` (School21 OpenAPI Specification v1).

## Установка

```sh
npm install @s21/api
```

Требуется Node.js >= 18 и среда с поддержкой `fetch` (Node 18+, браузер, Deno, Bun).

## База

- Origin: `https://platform.21-school.ru`
- Путь API: `/services/21-school/api`
- Аутентификация: заголовок `Authorization` (apiKey). Токен задаётся через `client.transport.setAuthToken(token)`.

## Структура

- `src/transport/http.ts` — HTTP-транспорт (fetch-обёртка: baseUrl, query, body, headers, ошибки).
- `src/client/S21Client.ts` — фасад: владеет транспортом и инстанцирует ресурсы.
- `src/client/resources/` — ресурсы по группам эндпоинтов: `Campus`, `Cluster`, `Coalition`, `Course`, `Event`, `Graph`, `Participant`, `Project`, `Sale`.
- `src/types/` — DTO-типы из спецификации (см. `swagger`).
- `src/errors.ts` — типизированные ошибки.
- `src/config.ts` — константы base URL.

## Использование

```ts
import { S21Client } from "@s21/api";

const client = new S21Client({ baseUrl: "https://platform.21-school.ru/services/21-school/api" });

const me = await client.participant.getByLogin("qFioofa");
const projects = await client.participant.getProjects("qFioofa", { limit: 10 });
const graph = await client.graph.getGraph();
```

## Ресурсы и эндпоинты

| Ресурс        | Методы                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `campus`      | `getCampuses`, `getParticipants`, `getCoalitions`, `getClusters`                                                                                                                           |
| `cluster`     | `getMap`                                                                                                                                                                                   |
| `coalition`   | `getParticipants`                                                                                                                                                                          |
| `course`      | `getById`                                                                                                                                                                                  |
| `event`       | `getEvents`                                                                                                                                                                                |
| `graph`       | `getGraph`                                                                                                                                                                                 |
| `participant` | `getByLogin`, `getWorkstation`, `getSkills`, `getProjects`, `getProject`, `getPoints`, `getLogtime`, `getFeedback`, `getXpHistory`, `getCourses`, `getCourse`, `getCoalition`, `getBadges` |
| `project`     | `getById`, `getParticipants`                                                                                                                                                               |
| `sale`        | `getSales`                                                                                                                                                                                 |

## Проверка

```sh
npm run check
```

## Лицензия

[MIT](./LICENSE)
