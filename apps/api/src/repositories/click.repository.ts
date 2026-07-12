// Data access for click events. Only place click queries touch Prisma.
import { prisma } from '../lib/prisma';

export const clickRepository = {
  // Record one redirect. ipHash is already hashed by the caller.
  create(data: { linkId: string; referrer?: string | null; userAgent?: string | null; ipHash?: string | null }) {
    return prisma.clickEvent.create({ data });
  },

  countForLink(linkId: string) {
    return prisma.clickEvent.count({ where: { linkId } });
  },

  // The most recent clicks for a link, for the detail view's activity list.
  recentForLink(linkId: string, limit = 20) {
    return prisma.clickEvent.findMany({
      where: { linkId },
      orderBy: { clickedAt: 'desc' },
      take: limit,
    });
  },

  // All clicks for a link within a date window. The service groups these by day
  // to build the chart. For a portfolio-scale dataset this is plenty; a huge
  // dataset would push the grouping into SQL instead.
  forLinkSince(linkId: string, since: Date) {
    return prisma.clickEvent.findMany({
      where: { linkId, clickedAt: { gte: since } },
      orderBy: { clickedAt: 'asc' },
      select: { clickedAt: true },
    });
  },
};
