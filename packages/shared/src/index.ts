// Public entry point for @url-shortner/shared.
// Both apps import from here, e.g. `import { createLinkSchema, LinkDto } from '@url-shortner/shared'`.

// Validation schemas (request shapes + inferred input types)
export * from './schemas/auth.schema';
export * from './schemas/link.schema';

// DTOs (response shapes)
export * from './dto/auth.dto';
export * from './dto/link.dto';
export * from './dto/analytics.dto';

// Constants
export * from './constants/index';
