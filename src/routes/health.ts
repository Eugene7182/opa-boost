import { Router as createRouter } from "express";

import { prisma } from "../services/prisma.js";

export function createHealthRouter() {
  const router = createRouter();

  router.get("/", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ status: "error", error: (error as Error).message });
    }
  });

  return router;
}
