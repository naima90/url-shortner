// Loads and validates environment variables once, at startup.
// Mirrors apps/api/src/config/env.ts: fail fast with a clear message rather
// than dying later mid-poll-loop on a missing var.
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url(),

  AWS_REGION: z.string().default('eu-west-2'),
  CLICK_EVENTS_QUEUE_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
