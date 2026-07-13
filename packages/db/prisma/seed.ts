// Seeds the database with a demo user and a couple of links, so the dashboard
// has something to show on a fresh install. Safe to run repeatedly: it upserts.
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('password123');

  // Create (or reuse) a demo account.
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', passwordHash },
  });

  // A custom-alias link and an auto-code link.
  await prisma.link.upsert({
    where: { code: 'launch' },
    update: {},
    create: {
      code: 'launch',
      isCustomAlias: true,
      originalUrl: 'https://example.com/product-launch',
      ownerId: user.id,
    },
  });

  await prisma.link.upsert({
    where: { code: 'demo123' },
    update: {},
    create: {
      code: 'demo123',
      isCustomAlias: false,
      originalUrl: 'https://example.com/very/long/path?ref=newsletter',
      ownerId: user.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seeded demo user (demo@example.com / password123) and 2 links.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
