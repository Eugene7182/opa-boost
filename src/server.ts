import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { corsOrigins, env } from "./config/env.js";
import { connectPrisma, disconnectPrisma } from "./services/prisma.js";
import { createApiRouter } from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  await connectPrisma();

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.LOG_LEVEL === "debug" ? "dev" : "combined"));

  app.use("/api/v1", createApiRouter());

  const webAppDir = path.resolve(__dirname, "../dist/webapp");
  app.use("/", express.static(webAppDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(webAppDir, "index.html"), (error) => {
      if (error) {
        res.status(200).json({
          message: "Web application is not built yet. Run `npm run build` to generate the static files.",
        });
      }
    });
  });

  const server = app.listen(env.PORT, () => {
    console.log(`[server] listening on port ${env.PORT}`);
  });

  const shutdown = async () => {
    console.log("[server] shutting down");
    server.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error("[server] failed to start", error);
  process.exit(1);
});
