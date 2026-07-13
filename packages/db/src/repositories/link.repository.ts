// Data access for links. Only place link queries touch Prisma.
import { prisma } from '../client';

export const linkRepository = {
  findByCode(code: string) {
    return prisma.link.findUnique({ where: { code } });
  },

  findById(id: string) {
    return prisma.link.findUnique({ where: { id } });
  },

  create(data: {
    code: string;
    isCustomAlias: boolean;
    originalUrl: string;
    ownerId: string;
  }) {
    return prisma.link.create({ data });
  },

  // List a user's links, newest first, with a click count for each.
  // Prisma's _count avoids pulling every click row just to count them.
  listByOwner(ownerId: string) {
    return prisma.link.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { clicks: true } } },
    });
  },

  delete(id: string) {
    return prisma.link.delete({ where: { id } });
  },
};
