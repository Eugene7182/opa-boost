# OPA Boost MiniApp

Telegram mini-app stack for OPA Boost: Express + Prisma backend, Vite + React web client, and a Telegraf bot that shares auth state through Telegram WebApp init data.

## Features

- **API**: Express + Prisma with SQLite (`DATABASE_URL=file:./dev.db`) and JWT auth built on Telegram `initData`.
- **Web client**: Vite + React mini-app that boots inside Telegram, exchanges init data for a JWT, and consumes `/api/*` endpoints via Cloudflare tunnel.
- **Bot**: Telegraf bot that responds only to private chats, sends the WebApp button, and shares the same `.env.local`.
- **Dev tooling**: Single `npm run dev` runs backend, bot, and Vite dev server via `concurrently`. Cloudflare quick tunnels surface local ports 3000/5175 for Telegram testing.

## Requirements

- Node.js 20+ (project tested on v22.21.0)
- npm 10+
- SQLite (bundled with Prisma client)
- `cloudflared` CLI for trycloudflare tunnels

## Environment

Create `.env.local` at repo root (already tracked locally) with:

```
PORT=3000
DATABASE_URL=file:./dev.db
JWT_SECRET=change_me
TELEGRAM_BOT_TOKEN=<bot token>
WEBAPP_URL=<https://web-subdomain.trycloudflare.com/>
API_URL=<https://api-subdomain.trycloudflare.com/>
```

For the web client, set `src/webapp/.env`:

```
VITE_API_URL=<https://api-subdomain.trycloudflare.com/>
```

## Development workflow

1. Install deps: `npm install`
2. Generate Prisma client / seed data if needed: `npm run prisma:generate`, `npm run prisma:seed`
3. Run all services: `TMPDIR=/tmp npm run dev`
   - Backend → http://localhost:3000
   - Frontend → http://localhost:5175
   - Bot → Telegraf watcher
4. Start tunnels (new URLs each run):

```
cloudflared tunnel --url http://127.0.0.1:3000   # API
cloudflared tunnel --url http://127.0.0.1:5175   # Web
```

Update `.env.local` / `src/webapp/.env` with the printed trycloudflare URLs before reloading the app.

## Telegram testing

1. Open a private chat with `@Oppo_manager_bot`, send `/start`, tap **Открыть мини-апп**.
2. In the WebApp console verify:
   - `window.Telegram?.WebApp?.version`
   - `Telegram.WebApp.initDataUnsafe?.user`
3. Exchange init data for JWT:

```js
await fetch(`${import.meta.env.VITE_API_URL}/api/auth/telegram`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ initData: Telegram.WebApp.initData })
}).then((r) => r.json())
```

4. Guarded endpoint example:

```js
fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("opa-auth-token")}` }
}).then((r) => r.json())
```

## Health checks

- `GET /` → `OK`
- `GET /healthz` → `{ ok: true }`
- Cloudflare HTTPS health: `curl https://<api-subdomain>.trycloudflare.com/healthz`

## Project structure

```
.
├── src
│   ├── server.ts          # Express app, auth endpoints, CORS
│   ├── bot.ts             # Telegraf bot setup
│   ├── webapp/            # Vite React mini-app
│   └── routes/            # API routers
├── prisma/                # Prisma schema, migrations, seed
├── README.md
└── docs/
```

See `PROJECT_OVERVIEW.md` for a deeper explanation of architecture and operational notes.
