// The one place all errors funnel through. Registered LAST in app.ts so any
// error thrown (or passed to next(err)) anywhere ends up here.
import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { ValidationError } from '../errors/httpErrors';
import { env } from '../config/env';
import { logger } from '../lib/logger';

// Express detects an error handler by its four arguments, so `next` must stay
// even though it is unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  // Errors we threw on purpose: safe to report as-is.
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      error: { message: err.message, code: err.code },
    };
    // Attach field-level details for validation errors so forms can use them.
    if (err instanceof ValidationError && err.details) {
      (body.error as Record<string, unknown>).details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Anything else is an unexpected bug. Log the full error server-side, but
  // never leak internals (stack traces, messages) to the client.
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'development' ? String(err) : 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};
