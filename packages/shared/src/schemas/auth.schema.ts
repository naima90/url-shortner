// Validation schemas for authentication requests.
// Both the frontend forms and the backend routes import these, so the rules
// (what counts as a valid email, how long a password must be) are defined once.
import { z } from 'zod';

// Register: create a new account.
export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  // 8 char minimum is a sensible floor. The real strength comes from argon2
  // hashing on the server; we just avoid obviously weak inputs here.
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

// Login: same shape, but we do not re-check password strength on the way in.
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Inferred TypeScript types, so callers get autocomplete and type-safety for free.
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
