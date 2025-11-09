import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { env } from "./config/env";
import { router as api } from "./routes/index";

type AuthedRequest = Request & { user?: unknown };

type JwtPayload = {
  sub?: number | string;
  tg?: {
    id?: number;
    username?: string;
  };
};

const prisma = new PrismaClient();
const PORT = env.PORT;
const ORIGIN = (env.WEBAPP_URL || "").replace(/\/$/, "");
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = env.JWT_SECRET;

const urlencoded = express.urlencoded({ extended: false });

const checkTelegramInitData = (initData: string, botToken: string): boolean => {
  if (!initData || !botToken) return false;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  } catch {
    return false;
  }
};

const authMiddleware = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
};

export const app = express();

app.use(
  cors({
    origin: ORIGIN || undefined,
    credentials: true
  })
);
app.use(express.json());
app.use(urlencoded);
app.set(
  "json replacer",
  (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value)
);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/telegram", (req, res) => {
  const initData = typeof req.body?.initData === "string" ? req.body.initData : "";
  if (!checkTelegramInitData(initData, BOT_TOKEN)) {
    return res.status(401).json({ ok: false, error: "bad initData" });
  }

  const parsed = new URLSearchParams(initData);
  const userRaw = parsed.get("user");
  let telegramUser: { id?: number; username?: string } | null = null;
  if (userRaw) {
    try {
      telegramUser = JSON.parse(userRaw);
    } catch {
      telegramUser = null;
    }
  }

  const payload: JwtPayload = {
    sub: telegramUser?.id,
    tg: { id: telegramUser?.id, username: telegramUser?.username }
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  return res.json({ ok: true, token });
});

app.get("/api/me", authMiddleware, async (req: AuthedRequest, res) => {
  const payload = (req.user || {}) as JwtPayload;
  const telegramId = payload.tg?.id;

  if (!telegramId) {
    return res.status(200).json({ ok: true, user: payload });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { tgId: BigInt(telegramId) }
    });

    return res.json({ ok: true, user: user ?? payload });
  } catch (error) {
    console.error("Failed to load user", error);
    return res.status(500).json({ ok: false, error: "failed to load user" });
  }
});

app.use("/api", api);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal Error" });
});

export const createServer = (port = PORT): Server => {
  const server = app.listen(port, "0.0.0.0", () => {
    const address = server.address() as AddressInfo | null;
    const actualPort = address?.port ?? port;
    console.log(`Server http://0.0.0.0:${actualPort} (WEBAPP_URL=${ORIGIN})`);
  });
  return server;
};

export const server = process.env.NODE_ENV === "test" ? undefined : createServer();
