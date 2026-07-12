// Protects routes that require a logged-in user.
// It reads the access token from the httpOnly cookie (never from a header the
// page's JS could set), verifies it, and attaches req.user for controllers.
import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError } from '../errors/httpErrors';

// The cookie name the auth controller sets on login.
export const ACCESS_TOKEN_COOKIE = 'access_token';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!token) {
    next(new UnauthorizedError('Not authenticated'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    // Make the user available to downstream controllers and services.
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    // Token was tampered with or expired.
    next(new UnauthorizedError('Session expired or invalid'));
  }
};
