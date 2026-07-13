// Publishes click events to SQS instead of writing them to Postgres directly.
// A separate worker (apps/worker) consumes this queue and does the DB write,
// so a slow or unavailable database never blocks a redirect.
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { env } from '../config/env';

const sqsClient = new SQSClient({ region: env.AWS_REGION });

export type ClickEventMessage = {
  linkId: string;
  clickedAt: string;
  referrer: string | null;
  userAgent: string | null;
  ipHash: string | null;
};

export async function publishClickEvent(payload: ClickEventMessage): Promise<void> {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: env.CLICK_EVENTS_QUEUE_URL,
      MessageBody: JSON.stringify(payload),
    }),
  );
}
