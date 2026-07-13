// Turns one SQS message body into the Postgres write that apps/api used to do
// synchronously in the redirect request path (see analyticsService.recordClick).
import { clickRepository } from '@url-shortner/db';

export type ClickEventMessage = {
  linkId: string;
  clickedAt: string;
  referrer: string | null;
  userAgent: string | null;
  ipHash: string | null;
};

export function parseClickEventMessage(body: string): ClickEventMessage {
  const parsed = JSON.parse(body) as ClickEventMessage;
  if (!parsed.linkId) {
    throw new Error('Click event message is missing linkId');
  }
  return parsed;
}

export async function recordClickEvent(message: ClickEventMessage): Promise<void> {
  await clickRepository.create({
    linkId: message.linkId,
    referrer: message.referrer,
    userAgent: message.userAgent,
    ipHash: message.ipHash,
  });
}
