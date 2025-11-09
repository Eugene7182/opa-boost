import "dotenv/config"
import { Telegraf, Markup } from "telegraf"
import { env } from "./config/env"

export const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN)

bot.start(async (ctx) => {
  if (ctx.chat?.type !== "private") {
    console.warn(`Ignoring /start for non-private chat ${ctx.chat?.id} (${ctx.chat?.type})`)
    return
  }

  const kb = Markup.keyboard([
    Markup.button.webApp("Открыть мини-апп", env.WEBAPP_URL)
  ]).resize()

  try {
    await ctx.reply("Добро пожаловать! Открой мини-апп:", kb)
  } catch (error) {
    console.error("Failed to send welcome message", error)
  }
})

bot
  .launch()
  .then(() => console.log("Bot launched"))
  .catch((error) => {
    console.warn("Bot did not launch (token may be invalid)", error?.message || error)
  })

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
