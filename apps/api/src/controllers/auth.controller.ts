// HTTP layer for auth. Controllers read the request, call the service, and set
// cookies / send the response. They contain no business logic themselves.
import type { Request, Response, NextFunction } from 'express';
import type { AuthResponseDto } from '@url-shortner/shared';
import { authService, type AuthResult } from '../services/auth.service';
import { env } from '../config/env';
import { ACCESS_TOKEN_COOKIE } from '../middleware/auth.middleware';

// Cookie name for the refresh token. Scoped to the refresh endpoint path so it
// is only sent where it is needed.
const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Shared cookie options. httpOnly keeps the token out of reach of page scripts;
// Secure requires HTTPS (on in production); SameSite=Lax mitigates CSRF while
// still allowing top-level navigations.
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: '/',
  };
}

// Write both tokens as cookies on the response.
function setAuthCookies(res: Response, result: AuthResult): void {
  res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
    ...baseCookieOptions(),
    maxAge: 15 * 60 * 1000, // 15 minutes, matches the access token lifetime
  });
  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    ...baseCookieOptions(),
    path: '/api/auth', // only sent to the auth endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Clear both cookies (used on logout).
function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseCookieOptions() });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseCookieOptions(), path: '/api/auth' });
}

export const authController = {
  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);
      setAuthCookies(res, result);
      const body: AuthResponseDto = { user: result.user };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      setAuthCookies(res, result);
      const body: AuthResponseDto = { user: result.user };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/refresh
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
      const result = await authService.refresh(token);
      setAuthCookies(res, result);
      const body: AuthResponseDto = { user: result.user };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
      await authService.logout(token);
      clearAuthCookies(res);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/me  (protected) returns the current user from the token.
  async me(req: Request, res: Response): Promise<void> {
    // requireAuth guarantees req.user is set before this runs.
    res.status(200).json({ user: req.user });
  },
};
