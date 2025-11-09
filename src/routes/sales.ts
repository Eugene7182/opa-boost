import { Router } from "express"
import { db } from "../db"

const r = Router()

r.get("/", async (_req, res) => {
  const rows = await db.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  })
  res.json(rows)
})

r.post("/", async (req, res) => {
  const { userId = 1, storeId = 1, skuId, qty, price } = req.body as {
    userId?: number | string
    storeId?: number | string
    skuId?: number | string
    qty?: number | string
    price?: number | string
  }

  const parsedQty = qty !== undefined ? Number(qty) : undefined
  const storeIdNumber = Number(storeId)
  const skuIdNumber = Number(skuId)
  const userIdNumber = Number(userId)

  if (!skuId || parsedQty === undefined) {
    return res.status(400).json({ error: "skuId and qty are required" })
  }

  if (!Number.isFinite(parsedQty) || Number.isNaN(storeIdNumber) || Number.isNaN(userIdNumber) || Number.isNaN(skuIdNumber)) {
    return res.status(400).json({ error: "Invalid numeric payload" })
  }

  const sale = await db.sale.create({
    data: {
      userId: userIdNumber,
      storeId: storeIdNumber,
      skuId: skuIdNumber,
      qty: parsedQty,
      price: price !== undefined ? Number(price) : null
    }
  })

  await db.stock.upsert({
    where: {
      storeId_skuId: {
        storeId: storeIdNumber,
        skuId: skuIdNumber
      }
    },
    update: { qty: { decrement: parsedQty } },
    create: {
      storeId: storeIdNumber,
      skuId: skuIdNumber,
      qty: 0 - parsedQty
    }
  })

  res.json(sale)
})

export default r
