// Validation schema for creating a short link.
// This is the single source of truth: the shorten form on the frontend and the
// POST /api/links route on the backend both validate against it.
import { z } from 'zod';
import {
  ALIAS_PATTERN,
  MAX_ALIAS_LENGTH,
  MIN_ALIAS_LENGTH,
  RESERVED_ALIAS_SET,
} from '../constants/index';

export const createLinkSchema = z.object({
  // The destination we redirect to. Must be a real http/https URL.
  originalUrl: z
    .string()
    .url('Enter a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL must start with http:// or https://',
    ),

  // Optional custom alias. If the user leaves it blank, the server generates
  // a random code instead. When provided, it must be URL-safe, the right
  // length, and not a reserved word.
  customAlias: z
    .string()
    .min(MIN_ALIAS_LENGTH, `Alias must be at least ${MIN_ALIAS_LENGTH} characters`)
    .max(MAX_ALIAS_LENGTH, `Alias must be at most ${MAX_ALIAS_LENGTH} characters`)
    .regex(ALIAS_PATTERN, 'Alias can only contain letters, numbers, hyphens, and underscores')
    .refine((alias) => !RESERVED_ALIAS_SET.has(alias.toLowerCase()), 'That alias is reserved')
    .optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
