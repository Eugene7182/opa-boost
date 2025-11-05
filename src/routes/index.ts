import { Router as createRouter } from "express";

import { createAuthRouter } from "./auth.js";
import { createBonusesRouter } from "./bonuses.js";
import { createHealthRouter } from "./health.js";
import { createInventoryRouter } from "./inventory.js";
import { createSalesRouter } from "./sales.js";

export function createApiRouter() {
  const router = createRouter();

  router.use("/health", createHealthRouter());
  router.get("/version", (_req, res) => {
    res.json({ version: "1.0.0" });
  });
  router.use("/auth", createAuthRouter());
  router.use("/inventory", createInventoryRouter());
  router.use("/sales", createSalesRouter());
  router.use("/bonuses", createBonusesRouter());

  return router;
}
