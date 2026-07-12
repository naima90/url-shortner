// Helpers to keep the test database clean between integration tests.
// These run against the SEPARATE test database configured in .env.test, never
// the dev database.
import { prisma } from '../../../src/lib/prisma';

// Wipe all rows. TRUNCATE ... CASCADE clears dependent tables too and resets
// quickly between tests.
export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "ClickEvent", "RefreshToken", "Link", "User" RESTART IDENTITY CASCADE;',
  );
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
