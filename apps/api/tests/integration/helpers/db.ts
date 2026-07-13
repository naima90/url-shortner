// Helpers to keep the test database clean between integration tests.
// These run against the SEPARATE test database configured in .env.test, never
// the dev database.
import { prisma } from '@url-shortner/db';
import { redis } from '../../../src/lib/redis';

// Wipe all rows. TRUNCATE ... CASCADE clears dependent tables too and resets
// quickly between tests.
export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "ClickEvent", "RefreshToken", "Link", "User" RESTART IDENTITY CASCADE;',
  );
  // The redirect route and rate limiters both cache/count through Redis;
  // clear it too so one test's cached link or rate-limit count can't leak
  // into the next.
  await redis.flushdb();
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  // Without this, the open Redis connection keeps the event loop alive and
  // Jest hangs after the run instead of exiting.
  await redis.quit();
}
