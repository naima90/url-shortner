// Constants shared by both the frontend and the backend.
// Keeping them here means the two never disagree on things like code length
// or which aliases are off limits.

// How many characters an auto-generated short code has.
// 7 characters from a 64-char alphabet gives ~4.4 trillion combinations,
// which is plenty for a portfolio project and keeps links short.
export const SHORT_CODE_LENGTH = 7;

// Bounds for user-chosen custom aliases.
export const MIN_ALIAS_LENGTH = 3;
export const MAX_ALIAS_LENGTH = 32;

// Custom aliases can only contain URL-safe characters: letters, numbers,
// hyphens, and underscores. This is enforced by the zod schema too.
export const ALIAS_PATTERN = /^[a-zA-Z0-9_-]+$/;

// Words a custom alias is NOT allowed to be, because they would collide with
// real routes on the site (or just look like system pages). The redirect route
// lives at the app root, so a short code of "login" could otherwise shadow a
// real page once things are wired behind one domain.
export const RESERVED_ALIASES: readonly string[] = [
  'api',
  'admin',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'dashboard',
  'settings',
  'account',
  'help',
  'about',
  'terms',
  'privacy',
  'static',
  'assets',
  'favicon',
  'robots',
  'health',
];

// Fast lookup set for the reserved words above (case-insensitive checks use this).
export const RESERVED_ALIAS_SET = new Set(RESERVED_ALIASES.map((a) => a.toLowerCase()));
