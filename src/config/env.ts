const readEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const readNumber = (key: string, fallback?: number): number => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    if (fallback === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
};

export const env = {
  TELEGRAM_BOT_TOKEN: readEnv("TELEGRAM_BOT_TOKEN"),
  WEBAPP_URL: readEnv("WEBAPP_URL"),
  JWT_SECRET: readEnv("JWT_SECRET"),
  PORT: readNumber("PORT", 3000),
  DATABASE_URL: readEnv("DATABASE_URL")
};
