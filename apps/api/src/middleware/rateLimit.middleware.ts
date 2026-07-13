// Rate limiters. These blunt abuse of the most sensitive endpoints.
// Auth endpoints get a strict limit (slows brute force / credential stuffing).
// Link creation gets a moderate limit (slows spam / phishing link generation).
// Backed by Redis rather than the default in-memory store: with multiple API
// tasks behind the ALB, an in-memory store would count per-process, letting
// the effective limit scale with task count instead of staying fixed.
import rateLimit from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { env } from '../config/env';
import { redis } from '../lib/redis';

function redisStore(prefix: string) {
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) =>
      redis.call(args[0], ...args.slice(1)) as Promise<RedisReply>,
  });
}

// Strict: applied to /api/auth/login and /api/auth/register.
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('rl:auth:'),
  message: { error: { message: 'Too many attempts, try again later', code: 'TOO_MANY_REQUESTS' } },
});

// Moderate: applied to POST /api/links so one user cannot mint thousands of
// links in a burst.
export const createLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('rl:createLink:'),
  message: { error: { message: 'Too many links created, slow down', code: 'TOO_MANY_REQUESTS' } },
});
