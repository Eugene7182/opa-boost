import "dotenv/config"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import express, { type NextFunction, type Request, type Response } from "express"
import type { AddressInfo } from "node:net"
import type { Server } from "node:http"
import crypto from "node:crypto"
import jwt from "jsonwebtoken"
import { env } from "./config/env"
import { router as api } from "./routes/index"

const allowedOrigin = env.WEBAPP_URL.replace(/\/$/, "")
const urlencoded = express.urlencoded({ extended: false })

type AuthedRequest = Request & { user?: unknown }

const checkTelegramInitData = (initData: string, botToken: string): boolean => {
  if (!initData || !botToken) return false

  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  if (!hash) return false

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const calc = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))
  } catch {
    return false
  }
}

const authMiddleware = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ ok: false, error: "unauthorized" })
  try {
    req.user = jwt.verify(token, env.JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ ok: false, error: "unauthorized" })
  }
}

export const app = express()

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
)
app.use(cookieParser())
app.use(bodyParser.json())
app.set(
  "json replacer",
  (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value)
)

app.get("/", (_req, res) => res.send("OK"))
app.get("/health", (_req, res) => res.json({ ok: true }))
app.get("/healthz", (_req, res) => res.json({ ok: true }))

app.post("/api/auth/telegram", urlencoded, (req, res) => {
  const initData = typeof req.body?.initData === "string" ? req.body.initData : ""
  if (!checkTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN)) {
    return res.status(401).json({ ok: false, error: "bad initData" })
  }

  const parsed = new URLSearchParams(initData)
  const userRaw = parsed.get("user")
  let user: { id?: number; username?: string } | null = null
  if (userRaw) {
    try {
      user = JSON.parse(userRaw)
    } catch {
      user = null
    }
  }
  const token = jwt.sign(
    { sub: user?.id, tg: { id: user?.id, username: user?.username } },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  )

  res.json({ ok: true, token })
})

app.get("/api/me", authMiddleware, (req: AuthedRequest, res) => {
  res.json({ ok: true, user: req.user })
})
app.use("/api", api)

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err?.message || "Internal Error" })
})

export const createServer = (port = env.PORT): Server => {
  const server = app.listen(port, () => {
    const address = server.address() as AddressInfo | null
    const actualPort = address?.port ?? port
    console.log(`Server http://localhost:${actualPort}  (WEBAPP_URL=${env.WEBAPP_URL})`)
  })
  return server
}

export const server = process.env.NODE_ENV === "test" ? undefined : createServer()
