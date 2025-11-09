import { PrismaClient } from "@prisma/client"
import request from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { app } from "../src/server"

const prisma = new PrismaClient()

beforeAll(async () => {
  const region = await prisma.region.upsert({
    where: { name: "Алматы" },
    update: {},
    create: { name: "Алматы" }
  })

  const storeName = "Магазин А"
  let store = await prisma.store.findFirst({ where: { name: storeName } })
  if (!store) {
    store = await prisma.store.create({ data: { name: storeName, regionId: region.id } })
  }

  const skuCode = "SKU-1"
  let sku = await prisma.sKU.findUnique({ where: { code: skuCode } })
  if (!sku) {
    sku = await prisma.sKU.create({ data: { code: skuCode, name: "Товар 1" } })
  }

  await prisma.user.upsert({
    where: { tgId: BigInt(1) },
    update: { role: "ADMIN" },
    create: { tgId: BigInt(1), firstName: "Admin", role: "ADMIN" }
  })

  await prisma.stock.upsert({
    where: { storeId_skuId: { storeId: store.id, skuId: sku.id } },
    update: { qty: 50 },
    create: { storeId: store.id, skuId: sku.id, qty: 50 }
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe("api", () => {
  it("GET /api/refs/regions returns seeded regions", async () => {
    const response = await request(app).get("/api/refs/regions")
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(0)
  })

  it("POST /api/sales creates a sale", async () => {
    const [storesRes, skuRes] = await Promise.all([
      request(app).get("/api/refs/stores"),
      request(app).get("/api/refs/sku")
    ])

    const storeId = storesRes.body?.[0]?.id
    const skuId = skuRes.body?.[0]?.id

    expect(storeId).toBeTruthy()
    expect(skuId).toBeTruthy()

    const payload = {
      userId: 1,
      storeId,
      skuId,
      qty: 3,
      price: 100
    }

    const response = await request(app).post("/api/sales").send(payload)

    expect(response.status).toBe(200)
    expect(response.body?.id).toBeTruthy()
    expect(Number(response.body?.qty)).toBe(payload.qty)
  })
})
