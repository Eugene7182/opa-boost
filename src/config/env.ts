import { config as loadEnv } from "dotenv";
import { z } from "zod";

const envFiles = [".env", ".env.local"] as const;
for (const file of envFiles) {
  loadEnv({ path: file, override: false });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  WEBAPP_URL: z.string().url("WEBAPP_URL must be a valid URL"),
  APP_BASE_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten());
  throw new Error("Environment validation failed");
}

export const env = parsed.data;

export const corsOrigins = parsed.data.CORS_ORIGINS
  ? parsed.data.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : parsed.data.APP_BASE_URL
    ? [parsed.data.APP_BASE_URL]
    : ["http://localhost:5173"];
