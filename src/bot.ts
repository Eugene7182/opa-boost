import { Markup, Telegraf } from "telegraf";

import { env } from "./config/env.js";

async function bootstrapBot() {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply(
      "Добро пожаловать в OPPO Mini App!",
      Markup.keyboard([
        Markup.button.webApp("Открыть платформу", env.WEBAPP_URL),
      ]).resize(),
    );
  });

  bot.hears(/webapp/i, (ctx) => {
    ctx.reply(
      "Откройте мини-приложение",
      Markup.inlineKeyboard([
        Markup.button.webApp("Открыть", env.WEBAPP_URL),
      ]),
    );
  });

  bot.catch((error) => {
    console.error("[bot] error", error);
  });

  await bot.launch();
  console.log("[bot] launched");

  const gracefulStop = async () => {
    console.log("[bot] stopping");
    await bot.stop();
    process.exit(0);
  };

  process.once("SIGINT", gracefulStop);
  process.once("SIGTERM", gracefulStop);
}

bootstrapBot().catch((error) => {
  console.error("[bot] failed to launch", error);
  process.exit(1);
});
