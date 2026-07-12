// A single shared pino logger. Structured JSON logs are easy for log
// aggregators to parse later, which matters for the observability phase.
import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  // In development, pretty-print is nice, but we keep it as plain JSON here to
  // avoid an extra dependency. Swap in pino-pretty later if you want colors.
});
