import path from "node:path";
import express from "express";
import bodyParser from "body-parser";
import { validate } from "@telegram-apps/init-data-node";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set in environment");
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// API авторизации TMA
app.post("/api/auth/tma", (req, res) => {
  try {
    const initData: string = req.body.initData || "";
    const parsed = validate(initData, BOT_TOKEN, { maxAgeSeconds: 600 });
    return res.json({ status: "ok", user: parsed.user });
  } catch (e: any) {
    return res.status(401).json({ status: "bad initData", error: e?.message });
  }
});

// Раздача собранной статики фронта (на проде)
const dist = path.join(process.cwd(), "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
});
