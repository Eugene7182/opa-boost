import { Router } from "express"
import { db } from "../db"

const r = Router()

r.get("/", async (req, res) => {
  const store = req.query.store ? Number(req.query.store) : undefined
  if (!store) {
    return res.status(400).json({ error: "store required" })
  }
  const rows = await db.stock.findMany({
    where: { storeId: store },
    include: { sku: true }
  })
  res.json(rows)
})

r.post("/", async (req, res) => {
  const { storeId, items } = req.body as {
    storeId?: number | string
    items?: Array<{ skuId: number | string; qty: number }>
  }
  if (!storeId) {
    return res.status(400).json({ error: "storeId required" })
  }
  const storeIdNumber = Number(storeId)
  if (Number.isNaN(storeIdNumber)) {
    return res.status(400).json({ error: "Invalid storeId value" })
  }

  for (const it of items || []) {
    const skuIdNumber = Number(it.skuId)
    if (Number.isNaN(skuIdNumber)) {
      return res.status(400).json({ error: "Invalid skuId value" })
    }
    const qty = Number(it.qty)
    if (!Number.isFinite(qty)) {
      return res.status(400).json({ error: "Invalid qty value" })
    }
    await db.stock.upsert({
      where: {
        storeId_skuId: {
          storeId: storeIdNumber,
          skuId: skuIdNumber
        }
      },
      update: { qty },
      create: {
        storeId: storeIdNumber,
        skuId: skuIdNumber,
        qty
      }
    })
  }
  res.json({ status: "ok" })
})

export default r
