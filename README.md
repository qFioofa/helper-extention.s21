<h1 align="center">Helper S21</h1>

<p align="center">
  <em>Расширение для браузера, которое делает работу с платформой
  <a href="https://platform.21-school.ru">S21</a> удобнее: профиль, XP, кампус и
  события — прямо в popup расширения.</em>
</p>

<p align="center">
  <img src="./public/icons/icon128.png" alt="Helper S21" width="110" />
</p>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square&logo=github&logoColor=white" alt="License: MIT" />
  </a>
  <img src="https://img.shields.io/badge/Version-1.0.0-1E90FF?style=flat-square&logo=semver&logoColor=white" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/Last%20release-1.0.1-009688?style=flat-square&logo=git&logoColor=white" alt="Last release 1.0.1" />
  <img src="https://img.shields.io/badge/Manifest-MV3-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Firefox-Available-00B1B1?style=flat-square&logo=firefox&logoColor=white" alt="Firefox" />
</p>

---

## Стек

<p align="center">
  <a href="https://svelte.dev">
    <img src="https://go-skill-icons.vercel.app/api/icons?i=svelte,typescript,vite,tailwind,chrome,nodejs" alt="Svelte · TypeScript · Vite · Tailwind CSS · Chrome · Node.js" height="52" />
  </a>
</p>

- **Svelte 5** + **TypeScript**, сборка на **Vite**, стили — **Tailwind CSS**
- **Manifest V3**: `background.js` (service worker) + `content.js`
- API-клиент **[@qfioofa/s21-api](https://www.npmjs.com/package/@qfioofa/s21-api)**
- Поддержка **Chrome**, **Firefox**, **Safari**

## Ключевые возможности

- **Дашборд** — карта кампуса, продажи (Sales) и события в одном окне
- **Профиль** — уровень, XP, PRP и место в топе без захода на сайт
- **Поиск участников** — полные данные по нику в пару кликов
- **Навыки** — список навыков с накопленным XP
- **Авторизация** — хранение токена, вход и контроль статуса
- **Настройки и логи** — тёмная тема, компактные острова, подробный журнал

> Статус и последний релиз — [ссылка](https://github.com/qFioofa/helper-extention.s21/releases)

## Установка (Chrome)

Полная инструкция — в [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Структура проекта

<p align="center">
  <img src="diagrams/structure.png" alt="Структура проекта" />
</p>

```text
src/
├── core/             # stores, registry, logger
├── api/              # client, session, peer
├── infra/chrome/     # auth, token, cookies
└── ui/               # layout, island-виджеты (Svelte)
```

```bash
npm install
npm run build        # сборка в dist/
# chrome://extensions → Developer mode → Load unpacked → выбрать dist/
```

## Команды

```bash
npm run dev          # dev-сервер Vite
npm run build        # production-сборка в dist/
npm run check        # svelte-check / typecheck
npm run format       # prettier
npm run release      # release-конвейер (build + typecheck + отчёт)
plantuml -tpng diagrams/*.puml   # перегенерировать диаграммы
```

## Лицензия

Проект распространяется по лицензии [MIT](LICENSE).
