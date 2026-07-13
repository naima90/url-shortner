// Data access for refresh tokens. Tokens are stored hashed (see lib/hash.ts),
// so this layer only ever sees the hash, never the raw token.
import { prisma } from '../client';

export const refreshTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  // Mark a single token as revoked (used on logout or rotation).
  revoke(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  // Revoke every active token for a user (used as a "log out everywhere" action).
  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
