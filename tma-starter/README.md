# Telegram Mini App Starter

## Установка
```bash
npm install
```

Создай .env по образцу:

```bash
cp .env.example .env
# Открой .env и подставь реальный BOT_TOKEN из @BotFather
```

Dev
```bash
npm run dev
# откроется http://localhost:5173 (фронт), API слушает http://localhost:3000
```

Prod
```bash
npm run build
npm run start
```

Telegram

В @BotFather создай Mini App и поставь Web App URL (в dev можно через ngrok/cloudflared на порт 3000).

Авторизация идёт через WebApp.initData, подпись валидируется на сервере.

---

## После генерации
1) Зальёшь в GitHub.  
2) Скачай репо, скопируй `.env.example` → `.env`, подставь свой токен.  
3) `npm install && npm run dev`.  
4) Дай Telegram’у HTTPS-ссылку на сервер (ngrok/cloudflared) и проверь запуск из бота.

Готов расширить промт под Docker/Render/Actions или добавить кнопку запуска из сообщения с `web_app`.
