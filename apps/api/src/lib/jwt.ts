// JWT helpers for signing and verifying access and refresh tokens.
// Access tokens are short-lived and sent on every request (via cookie).
// Refresh tokens are longer-lived and used only to mint new access tokens.
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';

// What we embed inside a token. Keep it small: just enough to identify the user.
export interface JwtPayload {
  sub: string; // the user id
  email: string;
}

// Sign a short-lived access token. `jwtid` adds a unique id (jti) so two tokens
// for the same user, even signed in the same second, are never identical.
export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    jwtid: randomUUID(),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

// Sign a longer-lived refresh token. The unique jti matters here especially:
// we store a hash of this token, and identical tokens would collide on the
// unique tokenHash constraint.
export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    jwtid: randomUUID(),
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

// Verify an access token. Throws if invalid or expired.
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

// Verify a refresh token. Throws if invalid or expired.
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
