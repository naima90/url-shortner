// A single shared Redis connection, used for the rate-limit store (so limits
// are enforced across every API task, not per-process) and the redirect
// hot-path's code -> link cache.
import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis(env.REDIS_URL);
