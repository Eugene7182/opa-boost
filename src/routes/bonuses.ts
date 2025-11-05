import { Router as createRouter } from "express";
import { z } from "zod";

import { prisma } from "../services/prisma.js";

const bonusSchema = z.object({
  promoterId: z.string().min(1),
  amount: z.number().nonnegative(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  notes: z.string().optional(),
});

export function createBonusesRouter() {
  const router = createRouter();

  router.get("/", async (_req, res) => {
    const bonuses = await prisma.bonusPayout.findMany({
      include: {
        promoter: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        plan: true,
      },
      orderBy: { month: "desc" },
      take: 50,
    });

    res.json({ bonuses });
  });

  router.post("/", async (req, res) => {
    const parsed = bonusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const payout = await prisma.bonusPayout.create({
      data: {
        promoterId: parsed.data.promoterId,
        amount: parsed.data.amount,
        month: parsed.data.month,
        notes: parsed.data.notes ?? null,
      },
    });

    res.status(201).json({ bonus: payout });
  });

  return router;
}
