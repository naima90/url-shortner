// Loads and validates environment variables once, at startup.
// If a required secret is missing or malformed, the process exits immediately
// with a clear message instead of failing later in some random request.
import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from a .env file into process.env (no-op if the file is absent,
// e.g. in CI where vars are injected directly).
dotenv.config();

// The shape every required variable must satisfy. Defaults are only used for
// non-secret, safe-to-default values.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:4000'),

  // Env vars are always strings, so we accept the literal 'true' to mean true.
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  IP_HASH_SALT: z.string().min(1, 'IP_HASH_SALT is required'),

  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10),
});

// Validate now. On failure, print what is wrong and stop.
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// A typed, frozen config object the rest of the app imports.
export const env = parsed.data;
export type Env = typeof env;
