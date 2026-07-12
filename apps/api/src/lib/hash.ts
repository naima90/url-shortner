// Password hashing helpers, wrapping argon2.
// argon2 is the modern, memory-hard default recommended by OWASP. It resists
// GPU cracking better than bcrypt. We keep the wrapper thin so services never
// import argon2 directly.
import argon2 from 'argon2';
import crypto from 'node:crypto';
import { env } from '../config/env';

// Hash a plaintext password before storing it.
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

// Check a login attempt against the stored hash. Returns true on a match.
export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

// Hash a refresh token before storing it, so a database leak does not reveal
// usable tokens. A fast SHA-256 is fine here: the token is already high-entropy
// random data, so we do not need a slow password hash.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Hash a visitor IP with a server-side salt for privacy-preserving analytics.
// We never store the raw IP. Same IP always maps to the same hash, so abuse
// patterns are still visible, but the value cannot be reversed to an address.
export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + env.IP_HASH_SALT).digest('hex');
}
