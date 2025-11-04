#!/usr/bin/env bash
set -euo pipefail

# Путь до директории со скриптом и корня проекта.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

# Разрешаем переопределить порт/хост через переменные окружения.
PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"

cd "$ROOT_DIR"

npm run dev -- --host "$HOST" --port "$PORT" --clearScreen false
