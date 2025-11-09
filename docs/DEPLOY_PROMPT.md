# Prompt для авто-деплоя на Render, Vercel и Neon

## Назначение
Этот промт можно скопировать в Code Assistant (CodeX, Replit AI, GitHub Copilot Chat и т.д.), чтобы автоматически подготовить и задеплоить проект `opa-boost-main` на Render (backend), Vercel (frontend) и Neon (Postgres).

## Инструкция по использованию
1. Откройте AI-IDE / Code Assistant с доступом к локальному репозиторию.
2. Вставьте промт целиком и следуйте подсказкам ассистента.
3. Подготовьте значения переменных окружения (Telegram токен, JWT секрет, URL Neon).
4. После завершения деплоя зафиксируйте выданные URL и логи проверок.

## Полный промт
```
Project summary:
Full-stack TypeScript project (opa-boost-main):
- Backend: Express + Prisma ORM
- Frontend: React + Vite
- Telegram Mini App bot via Telegraf
- Database: Prisma schema with SQLite, should migrate to Postgres (Neon)
- Target hosting: Render (backend) + Vercel (frontend)
- GitHub repo: https://github.com/Eugene7182/opa-boost-main
- Goal: deploy to production using free tiers (no paid domains)

---

Your tasks:

1️⃣ Setup the backend for Render:
- Ensure schema.prisma uses provider "postgresql" with `env("DATABASE_URL")`.
- Add or verify npm scripts in package.json:


"scripts": {
"build": "tsc -p tsconfig.json",
"start": "node dist/server.js"
}

- Configure CORS to accept only the final Vercel frontend URL (to be set later via `process.env.WEBAPP_URL`).
- Add a minimal `/healthz` route returning `{ ok:true }`.
- Ensure the server listens on `process.env.PORT || 3000` and binds to `0.0.0.0`.

2️⃣ Prepare Render deployment:
- Set environment variables:
NODE_ENV=production
PORT=10000
DATABASE_URL=<NEON_POSTGRES_URL>?sslmode=require
JWT_SECRET=<temporary_secret>
TELEGRAM_BOT_TOKEN=<temporary_token>
WEBAPP_URL=https://placeholder.example/
- Build Command:
`npm ci && npx prisma generate && npx prisma migrate deploy`
- Start Command:
`npm run build && node dist/server.js`

3️⃣ Prepare frontend for Vercel:
- Ensure `src/webapp/.env` or `.env.local` contains:
`VITE_API_URL=https://opa-boost-main.onrender.com`
- Build Command: `npm run build`
- Output Directory: `dist`

4️⃣ Database migration:
- Replace SQLite with Neon Postgres URL in `.env`:
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
- Run locally:


npx prisma generate
npx prisma migrate deploy
npx prisma db seed


5️⃣ Commit and push changes to GitHub.
 Message: `"deploy: vercel+render+neon ready"`

6️⃣ Deploy:
- Backend: create Web Service on Render from this repo.
- Frontend: create project on Vercel from same repo.

7️⃣ After frontend deploy, update Render env var:
 `WEBAPP_URL=https://<your-vercel-app>.vercel.app/`
 then redeploy.

8️⃣ Telegram configuration:
 Run (replace token and URL):


curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setChatMenuButton
"
-H "Content-Type: application/json"
-d "{"menu_button":{"type":"web_app","text":"Open App","web_app":{"url":"https://<your-vercel-app>.vercel.app"}}}"


9️⃣ Final checks:
- Verify GET https://opa-boost-main.onrender.com/healthz returns `{ok:true}`.
- In Telegram DM with the bot, send `/start` and press “Open App”.
- Confirm in DevTools → Network:
POST `/api/auth/telegram` → 200, returns token
GET `/api/me` → 200, returns user.

10️⃣ Push final changes to GitHub if everything works.

---

Environment summary:
GitHub repo: https://github.com/Eugene7182/opa-boost-main
Backend: Render (free tier)
Frontend: Vercel (free tier)
Database: Neon (free tier)
No custom domains required.

Goal:
Fully automated end-to-end deployment of Telegram Mini App project without paid hosting.
Return me:
- Render API URL
- Vercel WebApp URL
- Neon connection string (masked)
- Verification logs (healthz check, Telegram test OK)

🧭 Что делать тебе

Открой CodeX / AI IDE / GitHub Copilot Chat (где у тебя AI умеет работать с кодом проекта).

Вставь туда этот текст целиком.

Дай CodeX доступ к твоему проекту opa-boost-main (он уже есть локально).

Когда он спросит переменные окружения:

TELEGRAM_BOT_TOKEN → вставь свой текущий токен (можно временный).

JWT_SECRET → любая длинная строка (например test_secret_key_123).

DATABASE_URL → вставишь после того, как создашь в https://neon.tech
.

После того как он закончит деплой, у тебя появятся:

Render API URL

Vercel Web URL

всё синхронизировано с твоим GitHub репо.
```

## Замечания
- Перед использованием промта убедитесь, что у вас есть доступы к Render, Vercel и Neon.
- Проверьте, что в репозитории отсутствуют несохранённые локальные изменения.
- Храните секреты вне Git, используйте переменные окружения или менеджеры секретов.
