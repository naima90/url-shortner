// Logs every incoming request using the shared pino logger.
// pino-http attaches a child logger to each request and logs method, path,
// status, and response time automatically.
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

export const requestLogger = pinoHttp({ logger });
