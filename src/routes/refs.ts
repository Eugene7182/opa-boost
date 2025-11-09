import { Router } from "express"
import { db } from "../db"

const r = Router()

r.get("/regions", async (_req, res) => {
  const regions = await db.legacyRegion.findMany()
  res.json(regions)
})

r.get("/stores", async (req, res) => {
  const regionParam = req.query.region
  let regionId: number | undefined
  if (regionParam !== undefined) {
    regionId = Number(regionParam)
    if (Number.isNaN(regionId)) {
      return res.status(400).json({ error: "Invalid region parameter" })
    }
  }

  const stores = await db.legacyStore.findMany({
    where: regionId ? { regionId } : {}
  })
  res.json(stores)
})

r.get("/sku", async (_req, res) => {
  const sku = await db.sKU.findMany()
  res.json(sku)
})

export default r
