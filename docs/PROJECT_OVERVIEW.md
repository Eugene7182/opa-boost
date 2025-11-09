# Project Overview

## Mission

OPA Boost MiniApp lets Telegram retail managers sync promo data between a web mini-app and an Express API. The system is tuned for rapid demos: everything runs locally, but Cloudflare quick tunnels expose the API/UI so the Telegram WebApp can talk to them over HTTPS.

## Components

### Backend (`src/server.ts`)
- Express + Prisma with SQLite storage (`prisma/dev.db` by default).
- `/api/auth/telegram` verifies `initData` signatures and issues JWTs.
- `/api/me` protects private data with a bearer-token guard.
- `cors()` origin locked to the current trycloudflare web URL; update `.env.local` after every tunnel restart.
- Health routes: `/`, `/healthz`.

### Telegram bot (`src/bot.ts`)
- Telegraf bot reads `TELEGRAM_BOT_TOKEN` & `WEBAPP_URL` from `.env.local`.
- Responds only in private chats and pushes a WebApp keyboard button.
- For QA, run `/start` in DM and ensure the button opens the Cloudflare hosted mini-app.

### Web client (`src/webapp`)
- Vite + React, served from `vite.config.ts` with `server.port=5175`.
- Uses `window.Telegram.WebApp.initData` to exchange for JWT and stores it in `localStorage` under `opa-auth-token`.
- `api.ts` prepends `VITE_API_URL` and injects Authorization headers automatically when a token is present.

## Local development

1. `npm install`
2. Copy `.env.local.example` → `.env.local`, set secrets/tunnel URLs.
3. Create `src/webapp/.env` with `VITE_API_URL=<api tunnel>`.
4. Run everything: `TMPDIR=/tmp npm run dev`
5. Start tunnels (new URLs every session):
   ```
   cloudflared tunnel --url http://127.0.0.1:3000   # API
   cloudflared tunnel --url http://127.0.0.1:5175   # Web
   ```
6. Update env files & restart dev server after URLs change.

## Deployment notes

- For stable domains, create named tunnels (Cloudflare Zero Trust) and place their hostnames in the env files/CORS config.
- Prisma currently uses SQLite; swap `DATABASE_URL` to Postgres/MySQL then run `prisma migrate deploy`.
- Build commands:
  - Web: `npm run build:web`
  - Server: `npm run build:server` → outputs `dist-server/server.js`
  - Start: `npm start`

## Testing checklist

- `curl http://localhost:3000/healthz` → `{ ok: true }`
- `curl https://<api tunnel>/healthz` → `{ ok: true }`
- Web tunnel loads without `allowedHosts` errors.
- DevTools console in WebApp:
  - `window.Telegram.WebApp.version` returns string.
  - `Telegram.WebApp.initDataUnsafe.user` contains Telegram user.
  - Auth POST returns `{ ok: true, token }`, and `/api/me` responds with decoded payload when called with `Authorization: Bearer <token>`.

Keep this doc aligned with README whenever architecture or dev flow changes.
