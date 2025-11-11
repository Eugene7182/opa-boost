import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seedLegacyModels() {
  const region = await db.legacyRegion.upsert({
    where: { name: "Алматы" },
    update: {},
    create: { name: "Алматы" }
  });

  let store = await db.legacyStore.findFirst({
    where: { name: "Магазин А", regionId: region.id }
  });
  if (!store) {
    store = await db.legacyStore.create({
      data: { name: "Магазин А", regionId: region.id }
    });
  }

  const skus = [
    { code: "SKU-1", name: "Товар 1" },
    { code: "SKU-2", name: "Товар 2" }
  ];

  for (const s of skus) {
    await db.sKU.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: s
    });
  }

  await db.legacyUser.upsert({
    where: { tgId: BigInt(1) },
    update: { role: "ADMIN" },
    create: { tgId: BigInt(1), firstName: "Admin", role: "ADMIN" }
  });

  await db.stock.upsert({
    where: { storeId_skuId: { storeId: store.id, skuId: 1 } },
    update: { qty: 50 },
    create: { storeId: store.id, skuId: 1, qty: 50 }
  });
}

async function seedOrgModels() {
  const roles = ["Admin", "Office", "Supervisor", "Trainer", "Promoter"];
  for (const name of roles) {
    await db.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  await db.network.upsert({
    where: { name: "OPPO" },
    update: {},
    create: { name: "OPPO" }
  });
}

async function main() {
  const baseRoles = ["Admin", "Promoter", "Office", "Supervisor", "Trainer"];
  for (const name of baseRoles) {
    await db.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  await seedOrgModels();
  await seedLegacyModels();
  console.log("✅ Seeded legacy demo data and org defaults");
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
