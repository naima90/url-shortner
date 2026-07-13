// Redis cache-aside for the code -> link lookup used on every redirect.
// Shared by the redirect controller (read-through) and the link service
// (invalidation on delete).
import { redis } from './redis';

const CACHE_TTL_SECONDS = 300;

export type CachedLink = { id: string; originalUrl: string };

function cacheKey(code: string): string {
  return `link:${code}`;
}

export async function getCachedLink(code: string): Promise<CachedLink | null> {
  const cached = await redis.get(cacheKey(code));
  return cached ? (JSON.parse(cached) as CachedLink) : null;
}

export async function setCachedLink(code: string, link: CachedLink): Promise<void> {
  await redis.set(cacheKey(code), JSON.stringify(link), 'EX', CACHE_TTL_SECONDS);
}

export async function invalidateLinkCache(code: string): Promise<void> {
  await redis.del(cacheKey(code));
}
