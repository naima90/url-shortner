// Business logic for links: create, list, delete.
// Handles short-code generation, custom-alias collision checks, and ownership.
import type { LinkDto } from '@url-shortner/shared';
import { RESERVED_ALIAS_SET } from '@url-shortner/shared';
import { linkRepository } from '@url-shortner/db';
import { generateShortCode } from '../lib/shortCode';
import { invalidateLinkCache } from '../lib/linkCache';
import { ConflictError, ForbiddenError, NotFoundError, BadRequestError } from '../errors/httpErrors';
import { env } from '../config/env';

// How many times we retry a random code if it happens to collide. Collisions
// are astronomically unlikely at 7 chars, but we guard anyway.
const MAX_CODE_ATTEMPTS = 5;

// Build the full short URL shown to the user from the bare code.
function toLinkDto(link: {
  id: string;
  code: string;
  isCustomAlias: boolean;
  originalUrl: string;
  createdAt: Date;
  expiresAt: Date | null;
  clickCount: number;
}): LinkDto {
  return {
    id: link.id,
    code: link.code,
    isCustomAlias: link.isCustomAlias,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
    createdAt: link.createdAt.toISOString(),
    expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
  };
}

export const linkService = {
  // The public base used to render the full clickable short link.
  publicBaseUrl: env.PUBLIC_BASE_URL,

  // Create a link. If the user supplied a custom alias we use it (after checking
  // it is free and not reserved); otherwise we generate a unique random code.
  async create(ownerId: string, originalUrl: string, customAlias?: string): Promise<LinkDto> {
    let code: string;
    let isCustomAlias: boolean;

    if (customAlias) {
      // Defense in depth: the zod schema already blocks reserved words, but we
      // re-check here so the rule holds no matter who calls the service.
      if (RESERVED_ALIAS_SET.has(customAlias.toLowerCase())) {
        throw new BadRequestError('That alias is reserved');
      }
      const taken = await linkRepository.findByCode(customAlias);
      if (taken) {
        throw new ConflictError('That alias is already taken');
      }
      code = customAlias;
      isCustomAlias = true;
    } else {
      // Generate and retry until we find a code no one is using.
      code = await this.generateUniqueCode();
      isCustomAlias = false;
    }

    const created = await linkRepository.create({ code, isCustomAlias, originalUrl, ownerId });
    // A brand-new link has zero clicks.
    return toLinkDto({ ...created, clickCount: 0 });
  },

  // Try random codes until one is unused, or give up after a few attempts.
  async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const candidate = generateShortCode();
      const existing = await linkRepository.findByCode(candidate);
      if (!existing) return candidate;
    }
    // If we somehow collided several times, surface a clear error rather than
    // looping forever.
    throw new ConflictError('Could not generate a unique code, please try again');
  },

  // List one user's links with click counts, newest first.
  async listForUser(ownerId: string): Promise<LinkDto[]> {
    const rows = await linkRepository.listByOwner(ownerId);
    return rows.map((row) =>
      toLinkDto({
        id: row.id,
        code: row.code,
        isCustomAlias: row.isCustomAlias,
        originalUrl: row.originalUrl,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        clickCount: row._count.clicks,
      }),
    );
  },

  // Delete a link, but only if it belongs to the requesting user.
  async delete(ownerId: string, linkId: string): Promise<void> {
    const link = await linkRepository.findById(linkId);
    if (!link) {
      throw new NotFoundError('Link not found');
    }
    // Ownership check: never let one user delete another user's link.
    if (link.ownerId !== ownerId) {
      throw new ForbiddenError('You do not own this link');
    }
    await linkRepository.delete(linkId);
    // Otherwise a cached redirect would keep serving this code until the TTL expires.
    await invalidateLinkCache(link.code);
  },
};
