# @s21/api

API-клиент для платформы S21 (School 21). Отдельный пакет-модуль, используемый расширением `helper-extension-s21`.

## Структура

- `src/transport/http.ts` — HTTP-транспорт (fetch-обёртка: baseUrl, заголовки, query, ошибки).
- `src/client/S21Client.ts` — фасад: владеет транспортом и инстанцирует ресурсы.
- `src/client/resources/` — обёртки над группами эндпоинтов (Auth, Profile, Projects, PeerReviews).
- `src/types/` — DTO-типы (заполняются из swagger).
- `src/errors.ts` — типизированные ошибки.

## Использование

```ts
import { S21Client } from "@s21/api";

const client = new S21Client({ baseUrl: "https://platform.s21" });
await client.profile.getCurrent();
```

## Проверка

```sh
npm run check --workspace @s21/api
```
