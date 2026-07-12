// Reads the public API URL. Falls back to localhost so the app still runs if
// someone forgets to create .env.local.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
