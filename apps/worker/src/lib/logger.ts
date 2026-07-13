// A single shared pino logger, matching apps/api/src/lib/logger.ts's setup so
// log output shape is consistent across services.
import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
});
