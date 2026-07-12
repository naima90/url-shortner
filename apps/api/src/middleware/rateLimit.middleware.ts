// Rate limiters. These blunt abuse of the most sensitive endpoints.
// Auth endpoints get a strict limit (slows brute force / credential stuffing).
// Link creation gets a moderate limit (slows spam / phishing link generation).
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Strict: applied to /api/auth/login and /api/auth/register.
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, try again later', code: 'TOO_MANY_REQUESTS' } },
});

// Moderate: applied to POST /api/links so one user cannot mint thousands of
// links in a burst.
export const createLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many links created, slow down', code: 'TOO_MANY_REQUESTS' } },
});
