// Generates random short codes for links.
// We use nanoid with a URL-safe alphabet so codes never need escaping and never
// contain lookalike-unfriendly characters that break when shared.
import { customAlphabet } from 'nanoid';
import { SHORT_CODE_LENGTH } from '@url-shortner/shared';

// Letters and digits only. No symbols, so codes are easy to type and share.
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const nanoid = customAlphabet(ALPHABET, SHORT_CODE_LENGTH);

// Return a fresh random code. The service layer is responsible for checking it
// is unique and retrying on the rare collision.
export function generateShortCode(): string {
  return nanoid();
}
