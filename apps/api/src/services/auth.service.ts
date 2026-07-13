// Business logic for authentication: register, login, refresh, logout.
// This layer knows nothing about HTTP (no req/res). It works with plain values
// and throws typed errors that the controller and error middleware turn into
// responses. That separation is what makes it easy to unit test.
import type { UserDto } from '@url-shortner/shared';
import { userRepository, refreshTokenRepository } from '@url-shortner/db';
import { hashPassword, verifyPassword, hashToken } from '../lib/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { ConflictError, UnauthorizedError } from '../errors/httpErrors';
import { env } from '../config/env';
import { logger } from '../lib/logger';

// Shape returned to the controller: the public user plus the two fresh tokens.
// The controller decides how to deliver them (cookies).
export interface AuthResult {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

// Turn a duration string like "7d" or "15m" into a future Date, for storing the
// refresh token's DB expiry. Supports s, m, h, d suffixes.
function expiryDateFrom(duration: string): Date {
  const match = /^(\d+)([smhd])$/.exec(duration);
  const now = Date.now();
  if (!match) {
    // Fallback: 7 days. Should not happen given env defaults.
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(now + value * (unitMs[unit] ?? unitMs.d));
}

// Map a Prisma user row to the safe public DTO (no passwordHash).
function toUserDto(user: { id: string; email: string; createdAt: Date }): UserDto {
  return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
}

// Issue a new access + refresh token pair and persist the refresh token's hash.
async function issueTokens(user: { id: string; email: string }): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const payload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store only the hash of the refresh token, plus when it expires.
  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: expiryDateFrom(env.JWT_REFRESH_EXPIRES_IN),
  });

  return { accessToken, refreshToken };
}

export const authService = {
  // Create a new account. Rejects a duplicate email.
  async register(email: string, password: string): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with that email already exists');
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({ email, passwordHash });
    const tokens = await issueTokens(user);

    return { user: toUserDto(user), ...tokens };
  },

  // Verify credentials and issue tokens. Uses the same generic error for both
  // "no such user" and "wrong password" so we do not reveal which emails exist.
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn({ email }, 'Login failed: no such user');
      throw new UnauthorizedError('Invalid email or password');
    }

    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      logger.warn({ email }, 'Login failed: wrong password');
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await issueTokens(user);
    return { user: toUserDto(user), ...tokens };
  },

  // Exchange a valid refresh token for a new pair, rotating the old one out.
  // If the presented token is unknown, expired, or already revoked, we reject.
  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is no longer valid');
    }

    // Rotate: revoke the token just used, then issue a fresh pair.
    await refreshTokenRepository.revoke(stored.tokenHash);

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    const tokens = await issueTokens(user);
    return { user: toUserDto(user), ...tokens };
  },

  // Log out by revoking the presented refresh token. Safe to call even if the
  // token is missing or already gone.
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await refreshTokenRepository.revoke(hashToken(refreshToken));
  },
};
