# OPPO Mini App Platform

Новая архитектура под Telegram Mini App включает три слоя:

1. **Express API** на TypeScript + Prisma (PostgreSQL)
2. **Web App** на Vite + React + TypeScript (`src/webapp`)
3. **Telegraf-бот** с кнопкой запуска мини-приложения

## Быстрый старт

```bash
npm install
cp .env.example .env.local
# заполните TELEGRAM_BOT_TOKEN, DATABASE_URL и WEBAPP_URL
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Команда `npm run dev` параллельно запускает Express API (`src/server.ts`), Telegraf-бота (`src/bot.ts`) и Vite Dev Server (`src/webapp`).

## Сборка и продакшн

```bash
npm run build
npm run start
```

Перед запуском в продакшне выполните миграции (`npm run prisma:deploy`). Команда `npm run start` поднимает собранный API и Telegram-бота, Express раздаёт статические файлы из `dist/webapp`.

## Структура проекта

```
prisma/
  schema.prisma
  migrations/
  seed.ts
src/
  server.ts
  bot.ts
  config/
  routes/
  services/
  webapp/
```

## Основные возможности API

- `/api/v1/health` — проверка статуса
- `/api/v1/version` — версия сборки
- `/api/v1/auth/telegram` — проверка initData и создание сессии
- `/api/v1/sales` — операции с продажами
- `/api/v1/inventory` — учёт остатков
- `/api/v1/bonuses` — бонусные выплаты

## База данных

Prisma схема описывает роли `ADMIN | SUPERVISOR | TRAINER | PROMOTER`, продажи, остатки, бонусные планы и сессии Mini App. Скрипт `prisma/seed.ts` создаёт базовые сущности для демо-данных.

## Развёртывание

- Настройте переменные окружения (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`, `APP_BASE_URL`, `CORS_ORIGINS`).
- Выполните миграции: `npm run prisma:deploy`.
- Запустите сборку фронта и сервера: `npm run build`.
- Стартовая команда: `npm run start`.
