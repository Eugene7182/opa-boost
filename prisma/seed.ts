import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const region = await db.region.upsert({
    where: { name: "Алматы" },
    update: {},
    create: { name: "Алматы" }
  })

  const store = await db.store.create({
    data: { name: "Магазин А", regionId: region.id }
  })

  const skus = [
    { code: "SKU-1", name: "Товар 1" },
    { code: "SKU-2", name: "Товар 2" }
  ]

  for (const s of skus) {
    await db.sKU.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: s
    })
  }

  await db.user.upsert({
    where: { tgId: BigInt(1) },
    update: { role: "ADMIN" },
    create: { tgId: BigInt(1), firstName: "Admin", role: "ADMIN" }
  })

  await db.stock.upsert({
    where: { storeId_skuId: { storeId: store.id, skuId: 1 } },
    update: { qty: 50 },
    create: { storeId: store.id, skuId: 1, qty: 50 }
  })
}

main()
  .catch((err) => {
    console.error("Seed failed", err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
