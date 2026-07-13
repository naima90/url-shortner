// Business logic for analytics: recording a click, and building the per-link
// analytics view (total, clicks-per-day, recent activity).
import type { LinkAnalyticsDto, DailyClickDto, ClickEventDto } from '@url-shortner/shared';
import { clickRepository, linkRepository } from '@url-shortner/db';
import { hashIp } from '../lib/hash';
import { publishClickEvent } from '../lib/sqs';
import { ForbiddenError, NotFoundError } from '../errors/httpErrors';

// Default window for the chart: the last 30 days.
const DEFAULT_WINDOW_DAYS = 30;

export const analyticsService = {
  // Record one redirect. The IP is hashed here, never stored raw, and the
  // event is published to SQS rather than written to Postgres directly — a
  // worker (apps/worker) does the actual write. This is awaited by the
  // redirect controller inside a try/catch, so a failure to record a click
  // never blocks the actual redirect.
  async recordClick(input: {
    linkId: string;
    referrer?: string | null;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<void> {
    await publishClickEvent({
      linkId: input.linkId,
      clickedAt: new Date().toISOString(),
      referrer: input.referrer ?? null,
      userAgent: input.userAgent ?? null,
      ipHash: input.ip ? hashIp(input.ip) : null,
    });
  },

  // Build the analytics payload for one link, checking ownership first.
  async getForLink(ownerId: string, linkId: string): Promise<LinkAnalyticsDto> {
    const link = await linkRepository.findById(linkId);
    if (!link) {
      throw new NotFoundError('Link not found');
    }
    if (link.ownerId !== ownerId) {
      throw new ForbiddenError('You do not own this link');
    }

    const since = new Date();
    since.setDate(since.getDate() - DEFAULT_WINDOW_DAYS);

    const [total, recent, windowRows] = await Promise.all([
      clickRepository.countForLink(linkId),
      clickRepository.recentForLink(linkId, 20),
      clickRepository.forLinkSince(linkId, since),
    ]);

    return {
      linkId: link.id,
      code: link.code,
      originalUrl: link.originalUrl,
      totalClicks: total,
      dailyClicks: groupByDay(windowRows.map((r) => r.clickedAt)),
      recentClicks: recent.map(toClickEventDto),
    };
  },
};

// Group a list of click timestamps into per-day counts (YYYY-MM-DD).
function groupByDay(timestamps: Date[]): DailyClickDto[] {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const day = ts.toISOString().slice(0, 10); // YYYY-MM-DD
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  // Sort chronologically so the chart draws left to right.
  return [...counts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
}

// Map a stored click row to the public DTO (no IP hash leaves the server).
function toClickEventDto(row: {
  clickedAt: Date;
  referrer: string | null;
  userAgent: string | null;
}): ClickEventDto {
  return {
    clickedAt: row.clickedAt.toISOString(),
    referrer: row.referrer,
    userAgent: row.userAgent,
  };
}
