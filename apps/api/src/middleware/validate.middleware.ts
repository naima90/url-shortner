// A small factory that turns a zod schema into Express middleware.
// Usage: router.post('/', validate(createLinkSchema), controller.create)
// It parses the chosen part of the request, replaces it with the parsed value
// (so downstream code gets typed, trimmed data), and throws a ValidationError
// with field details on failure.
import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors/httpErrors';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, part: RequestPart = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      // flatten() gives a tidy { fieldErrors, formErrors } shape for the client.
      next(new ValidationError('Validation failed', result.error.flatten()));
      return;
    }
    // Overwrite with the parsed (and coerced) data.
    req[part] = result.data;
    next();
  };
}
