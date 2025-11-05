import { Router as createRouter } from "express";
import { z } from "zod";

import { env } from "../config/env.js";
import { verifyTelegramInitData } from "../services/telegramAuth.js";

const bodySchema = z.object({
  initData: z.string().min(1, "initData is required"),
});

export function createAuthRouter() {
  const router = createRouter();

  router.post("/telegram", async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
      const session = await verifyTelegramInitData(parsed.data.initData, env.TELEGRAM_BOT_TOKEN);
      res.json({
        token: session.token,
        userId: session.userId,
        role: session.role,
        profile: {
          firstName: session.firstName,
          lastName: session.lastName,
          username: session.username,
        },
      });
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  });

  return router;
}
