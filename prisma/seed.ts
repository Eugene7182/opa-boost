import { Prisma, PrismaClient, Role, SaleChannel } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { telegramId: "admin" },
    update: { role: Role.ADMIN, firstName: "Admin" },
    create: {
      telegramId: "admin",
      role: Role.ADMIN,
      firstName: "Admin",
      lastName: "User",
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { telegramId: "supervisor" },
    update: { role: Role.SUPERVISOR },
    create: {
      telegramId: "supervisor",
      role: Role.SUPERVISOR,
      firstName: "Supervisor",
    },
  });

  const trainer = await prisma.user.upsert({
    where: { telegramId: "trainer" },
    update: { role: Role.TRAINER },
    create: {
      telegramId: "trainer",
      role: Role.TRAINER,
      firstName: "Trainer",
    },
  });

  const promoter = await prisma.user.upsert({
    where: { telegramId: "promoter" },
    update: { role: Role.PROMOTER },
    create: {
      telegramId: "promoter",
      role: Role.PROMOTER,
      firstName: "Promoter",
    },
  });

  const store = await prisma.store.upsert({
    where: { id: "store-1" },
    update: {},
    create: {
      id: "store-1",
      name: "Алматы Mega",
      network: "TechRetail",
      region: "Алматы",
    },
  });

  const product = await prisma.product.upsert({
    where: { sku: "OPPO-A78" },
    update: { name: "OPPO A78" },
    create: {
      sku: "OPPO-A78",
      name: "OPPO A78",
      price: new Prisma.Decimal(149990),
    },
  });

  await prisma.sale.create({
    data: {
      storeId: store.id,
      productId: product.id,
      promoterId: promoter.id,
      quantity: 5,
      amount: new Prisma.Decimal(5 * 149990),
      channel: SaleChannel.PROMOTER,
    },
  });

  await prisma.inventorySnapshot.create({
    data: {
      storeId: store.id,
      productId: product.id,
      quantity: 25,
    },
  });

  const plan = await prisma.bonusPlan.create({
    data: {
      title: "Январь 2025",
      bonusType: "fixed",
      value: new Prisma.Decimal(50000),
    },
  });

  await prisma.bonusPayout.create({
    data: {
      promoterId: promoter.id,
      planId: plan.id,
      amount: new Prisma.Decimal(50000),
      month: "2025-01",
    },
  });

  console.log("Seed completed", { admin: admin.id, supervisor: supervisor.id, trainer: trainer.id, promoter: promoter.id });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
