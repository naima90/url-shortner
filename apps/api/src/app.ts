// Builds and configures the Express app.
// Exported WITHOUT calling listen(), so tests (Supertest) can import the app
// directly. The actual server start lives in index.ts.
//
// Middleware order matters. Roughly: security headers -> CORS -> body parsing
// -> cookies -> logging -> routes -> 404 -> error handler (always last).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRouter } from './routes';
import { redirectRouter } from './routes/redirect.routes';
import { requestLogger } from './middleware/requestLogger.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { NotFoundError } from './errors/httpErrors';

export function createApp() {
  const app = express();

  // Trust the first proxy so req.ip reflects the real client behind a load
  // balancer (relevant once deployed; harmless locally).
  app.set('trust proxy', 1);

  // Security headers (CSP, X-Frame-Options, etc.).
  app.use(helmet());

  // CORS: only allow the web app's origin, and allow credentials so the browser
  // sends our httpOnly cookies on cross-origin API calls.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // Parse JSON bodies, with a small size cap to reduce payload-based abuse.
  app.use(express.json({ limit: '10kb' }));

  // Parse cookies so auth middleware can read the token cookie.
  app.use(cookieParser());

  // Structured request logging.
  app.use(requestLogger);

  // Health check, handy for uptime probes and the verification step.
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API routes under /api.
  app.use('/api', apiRouter);

  // Public short-link redirects at the root, e.g. GET /:code.
  // Mounted AFTER /api and /health so those take precedence over a code match.
  app.use('/', redirectRouter);

  // Anything unmatched is a 404 in our standard error shape.
  app.use((_req, _res, next) => {
    next(new NotFoundError('Route not found'));
  });

  // Central error handler. Must be registered last.
  app.use(errorMiddleware);

  return app;
}
