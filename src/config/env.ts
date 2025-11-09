import fs from "node:fs"
import path from "node:path"
import { config } from "dotenv"
import { z } from "zod"

const localEnv = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(localEnv)) {
  config({ path: localEnv })
} else {
  config()
}

const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  WEBAPP_URL: z
    .string()
    .refine(
      (value) => value.startsWith("http://localhost") || /^https?:\/\//.test(value),
      "Invalid input"
    ),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(3)
})

export const env = (() => {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("Invalid environment configuration", parsed.error.flatten())
    throw new Error("Environment validation failed")
  }
  return parsed.data
})()
