import crypto from "node:crypto";

import { z } from "zod";

import { prisma } from "./prisma.js";
import type { Role } from "@prisma/client";

const initDataSchema = z.object({
  hash: z.string(),
  auth_date: z.coerce.number(),
  query_id: z.string().optional(),
  user: z.string().transform((value) => JSON.parse(value) as TelegramUser),
});

const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  allows_write_to_pm: z.boolean().optional(),
});

type TelegramUser = z.infer<typeof telegramUserSchema>;

export interface AuthenticatedSession {
  token: string;
  userId: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}

function computeHmac(data: URLSearchParams, botToken: string): string {
  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const checkString = Array.from(data.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  return crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");
}

export async function verifyTelegramInitData(initDataRaw: string, botToken: string): Promise<AuthenticatedSession> {
  const params = new URLSearchParams(initDataRaw);
  const parsed = initDataSchema.safeParse(Object.fromEntries(params.entries()));

  if (!parsed.success) {
    throw new Error(`Invalid initData payload: ${parsed.error.message}`);
  }

  const { hash, user: rawUser, auth_date } = parsed.data;
  const calculatedHash = computeHmac(params, botToken);

  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(calculatedHash))) {
    throw new Error("initData hash mismatch");
  }

  const user = telegramUserSchema.parse(rawUser);

  if (Date.now() / 1000 - auth_date > 600) {
    throw new Error("initData is expired");
  }

  const defaultRole: Role = "PROMOTER";

  const dbUser = await prisma.user.upsert({
    where: { telegramId: String(user.id) },
    update: {
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
    },
    create: {
      telegramId: String(user.id),
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
      role: defaultRole,
    },
  });

  const sessionToken = crypto
    .createHmac("sha256", botToken)
    .update(`${dbUser.id}:${Date.now()}`)
    .digest("hex");

  await prisma.session.upsert({
    where: { userId: dbUser.id },
    update: { token: sessionToken },
    create: { token: sessionToken, userId: dbUser.id },
  });

  return {
    token: sessionToken,
    userId: dbUser.id,
    role: dbUser.role,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    username: dbUser.username,
  };
}
