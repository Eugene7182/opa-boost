import { Router as createRouter } from "express";
import { z } from "zod";

import { prisma } from "../services/prisma.js";

const inventorySchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  reportedAt: z.coerce.date().optional(),
});

export function createInventoryRouter() {
  const router = createRouter();

  router.get("/", async (_req, res) => {
    const snapshots = await prisma.inventorySnapshot.findMany({
      include: {
        store: true,
        product: true,
      },
      orderBy: { reportedAt: "desc" },
      take: 100,
    });

    res.json({ inventory: snapshots });
  });

  router.post("/", async (req, res) => {
    const parsed = inventorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const snapshot = await prisma.inventorySnapshot.create({
      data: {
        storeId: parsed.data.storeId,
        productId: parsed.data.productId,
        quantity: parsed.data.quantity,
        reportedAt: parsed.data.reportedAt,
      },
    });

    res.status(201).json({ inventory: snapshot });
  });

  return router;
}
