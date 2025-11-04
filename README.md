# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3e1831f2-db93-44de-b35e-4cdfe6127cc2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3e1831f2-db93-44de-b35e-4cdfe6127cc2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Backend services

The repository now includes a FastAPI backend under `backend/` with the following capabilities:

- Bonus сетки и коридоры: `GET/POST/PUT/DELETE /api/v1/bonus/networks`, `GET/POST/PUT/DELETE /api/v1/bonus/tiers`, `POST /api/v1/bonus/import` (CSV, поддержка dry-run).
- Планирование промоутеров: `GET/POST /api/v1/plans`, `GET /api/v1/plans/progress`.
- Продажи с расчётом бонуса: `POST /api/v1/sales` (параметр `memory_gb` обязателен).
- Остатки: `GET /api/v1/inventory`, `POST /api/v1/inventory/upsert`, `GET /api/v1/inventory/last-updates`.
- Приглашения и роли: `POST /api/v1/invitations`, `POST /api/v1/invitations/accept`, `POST /api/v1/invitations/assign-role`.
- Задачи и сообщения: `POST /api/v1/tasks`, `POST /api/v1/tasks/messages`.
- Обслуживание: `POST /api/v1/maintenance/run-inventory-reminder-now`.

### Запуск локально

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Переменные окружения:

- `DATABASE_URL` — строка подключения PostgreSQL.
- `SECRET_KEY` — секрет для JWT.
- `CORS_ORIGINS` — список разрешённых фронтенд-доменов (через запятую).
- `ENABLE_AI` — фича-флаг для AI-подсказок (по умолчанию false).

Для запуска планировщика APScheduler в продакшене используйте команду:

```bash
export PYTHONPATH="$(pwd)"
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Сидинг демо-данных

```bash
python backend/scripts/seed_demo_data.py
```

### E2E сценарий (ручной)

1. Импортируйте CSV в `POST /api/v1/bonus/import` (пример в `samples/bonus_import`).
2. Назначьте план промоутеру через `POST /api/v1/plans`.
3. Создайте продажу `POST /api/v1/sales` — убедитесь, что бонус рассчитан.
4. Проверьте прогресс `GET /api/v1/plans/progress`.
