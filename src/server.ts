import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { env } from "./config/env";
import { router as api } from "./routes/index";
import { requireRole } from "./middleware/authRole";

type OrgRoleName = "Admin" | "Office" | "Supervisor" | "Trainer" | "Promoter" | string;

type JwtPayload = {
  sub?: string | number;
  tg?: {
    id?: number;
    username?: string;
  };
  role?: OrgRoleName;
  roleId?: string | null;
};

type AuthedRequest = Request & { user?: JwtPayload };

const prisma = new PrismaClient();
const PORT = env.PORT;
const ORIGIN = (env.WEBAPP_URL || "").replace(/\/$/, "");
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = env.JWT_SECRET;

const urlencoded = express.urlencoded({ extended: false });

function parseAdminIds(src?: string) {
  return (src || "")
    .split(",")
    .map((s) => s.trim().replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

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

const auth = authMiddleware;

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

app.post("/api/auth/telegram", async (req, res) => {
  const initData = typeof req.body?.initData === "string" ? req.body.initData : "";
  if (!checkTelegramInitData(initData, BOT_TOKEN)) {
    return res.status(401).json({ ok: false, error: "bad initData" });
  }

  const parsed = new URLSearchParams(initData);
  const userRaw = parsed.get("user");
  let telegramUser: { id?: number; username?: string; first_name?: string; last_name?: string } | null = null;
  if (userRaw) {
    try {
      telegramUser = JSON.parse(userRaw);
    } catch {
      telegramUser = null;
    }
  }

  const tg = telegramUser;
  if (!tg?.id) {
    return res.status(400).json({ ok: false, error: "telegram user missing" });
  }

  try {
    const dbUser = await prisma.user.upsert({
      where: { telegramId: tg.id.toString() },
      update: {},
      create: {
        telegramId: tg.id.toString(),
        fullName: tg.username ?? tg.first_name ?? undefined
      },
      include: { role: true }
    });

    const adminIds = parseAdminIds(process.env.ADMIN_TG_IDS);
    const isAdmin = adminIds.includes(String(tg.id));

    const [adminRole, promoterRole] = await Promise.all([
      prisma.role.upsert({ where: { name: "Admin" }, update: {}, create: { name: "Admin" } }),
      prisma.role.upsert({ where: { name: "Promoter" }, update: {}, create: { name: "Promoter" } })
    ]);

    let role = dbUser.role?.name as "Admin" | "Promoter" | undefined;
    let roleId = dbUser.roleId ?? null;

    if (isAdmin && role !== "Admin") {
      await prisma.user.update({ where: { id: dbUser.id }, data: { roleId: adminRole.id } });
      role = "Admin";
      roleId = adminRole.id;
    } else if (!role) {
      await prisma.user.update({ where: { id: dbUser.id }, data: { roleId: promoterRole.id } });
      role = "Promoter";
      roleId = promoterRole.id;
    }

    const token = jwt.sign(
      {
        sub: dbUser.id,
        tg: { id: tg.id, username: tg.username },
        role: role || (isAdmin ? "Admin" : "Promoter"),
        roleId
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ ok: true, token });
  } catch (error) {
    console.error("Failed to upsert org user", error);
    return res.status(500).json({ ok: false, error: "failed to authenticate" });
  }
});

app.get("/api/me", auth, async (req: AuthedRequest, res) => {
  const payload = req.user ?? {};
  const telegramId = payload.tg?.id;
  const sub =
    typeof payload.sub === "string"
      ? payload.sub
      : typeof payload.sub === "number"
        ? payload.sub.toString()
        : undefined;

  try {
    const [orgUser, legacyUser] = await Promise.all([
      sub
        ? prisma.user.findUnique({
            where: { id: sub },
            include: { role: true, region: true, store: true }
          })
        : telegramId
          ? prisma.user.findUnique({
              where: { telegramId: telegramId.toString() },
              include: { role: true, region: true, store: true }
            })
          : Promise.resolve(null),
      telegramId
        ? prisma.legacyUser.findUnique({ where: { tgId: BigInt(telegramId) } })
        : Promise.resolve(null)
    ]);

    const user = orgUser ?? legacyUser ?? payload;

    return res.json({ ok: true, user, orgUser, legacyUser, role: payload.role ?? null });
  } catch (error) {
    console.error("Failed to load user", error);
    return res.status(500).json({ ok: false, error: "failed to load user" });
  }
});

app.use("/api", api);

app.get(
  "/api/org",
  auth,
  requireRole("Admin", "Office", "Supervisor"),
  async (_req: AuthedRequest, res) => {
    try {
      const networks = await prisma.network.findMany({
        include: {
          regions: {
            include: {
              offices: {
                include: { stores: { include: { promoters: { include: { role: true } } } } }
              },
              supervisors: { include: { role: true } }
            }
          }
        }
      });
      return res.json({ ok: true, networks });
    } catch (error) {
      console.error("Failed to load org tree", error);
      return res.status(500).json({ ok: false, error: "failed to load org" });
    }
  }
);

app.post(
  "/api/networks",
  auth,
  requireRole("Admin", "Office"),
  async (req: AuthedRequest, res) => {
    const { name } = req.body ?? {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, error: "name required" });
    }
    try {
      const network = await prisma.network.create({ data: { name } });
      return res.json({ ok: true, network });
    } catch (error) {
      console.error("Failed to create network", error);
      return res.status(500).json({ ok: false, error: "failed to create network" });
    }
  }
);

app.post(
  "/api/regions",
  auth,
  requireRole("Admin", "Office"),
  async (req: AuthedRequest, res) => {
    const { name, networkId } = req.body ?? {};
    if (!name || typeof name !== "string" || !networkId || typeof networkId !== "string") {
      return res.status(400).json({ ok: false, error: "name and networkId required" });
    }
    try {
      const region = await prisma.region.create({ data: { name, networkId } });
      return res.json({ ok: true, region });
    } catch (error) {
      console.error("Failed to create region", error);
      return res.status(500).json({ ok: false, error: "failed to create region" });
    }
  }
);

app.post(
  "/api/offices",
  auth,
  requireRole("Admin", "Office"),
  async (req: AuthedRequest, res) => {
    const { name, regionId } = req.body ?? {};
    if (!name || typeof name !== "string" || !regionId || typeof regionId !== "string") {
      return res.status(400).json({ ok: false, error: "name and regionId required" });
    }
    try {
      const office = await prisma.office.create({ data: { name, regionId } });
      return res.json({ ok: true, office });
    } catch (error) {
      console.error("Failed to create office", error);
      return res.status(500).json({ ok: false, error: "failed to create office" });
    }
  }
);

app.post(
  "/api/stores",
  auth,
  requireRole("Admin", "Office"),
  async (req: AuthedRequest, res) => {
    const { name, officeId, address, city } = req.body ?? {};
    if (!name || typeof name !== "string" || !officeId || typeof officeId !== "string") {
      return res.status(400).json({ ok: false, error: "name and officeId required" });
    }
    try {
      const store = await prisma.store.create({
        data: {
          name,
          officeId,
          address: typeof address === "string" ? address : null,
          city: typeof city === "string" ? city : null
        }
      });
      return res.json({ ok: true, store });
    } catch (error) {
      console.error("Failed to create store", error);
      return res.status(500).json({ ok: false, error: "failed to create store" });
    }
  }
);

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
