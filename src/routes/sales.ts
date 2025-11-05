import { Router as createRouter } from "express";
import { z } from "zod";

import { prisma } from "../services/prisma.js";

const createSaleSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  promoterId: z.string().optional(),
  quantity: z.number().int().positive(),
  amount: z.number().nonnegative(),
  channel: z.enum(["RETAIL", "PROMOTER"]).default("PROMOTER"),
  soldAt: z.coerce.date().optional(),
});

export function createSalesRouter() {
  const router = createRouter();

  router.get("/", async (_req, res) => {
    const sales = await prisma.sale.findMany({
      include: {
        store: true,
        product: true,
        promoter: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { soldAt: "desc" },
      take: 100,
    });

    res.json({ sales });
  });

  router.post("/", async (req, res) => {
    const parsed = createSaleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const sale = await prisma.sale.create({
      data: {
        storeId: parsed.data.storeId,
        productId: parsed.data.productId,
        promoterId: parsed.data.promoterId,
        quantity: parsed.data.quantity,
        amount: parsed.data.amount,
        channel: parsed.data.channel,
        soldAt: parsed.data.soldAt,
      },
    });

    res.status(201).json({ sale });
  });

  return router;
}
