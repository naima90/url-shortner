// Long-polls the click-events queue and hands each message to recordClickEvent.
// A message is only deleted after a successful DB write; a failure leaves it
// in the queue to become visible again and retry (eventual dead-letter-queue
// redrive is a queue-configuration concern, not this code's).
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { env } from './config/env';
import { logger } from './lib/logger';
import { parseClickEventMessage, recordClickEvent } from './handlers/recordClickEvent';

const sqsClient = new SQSClient({ region: env.AWS_REGION });

const WAIT_TIME_SECONDS = 20;
const MAX_MESSAGES = 10;

export async function pollOnce(): Promise<void> {
  const { Messages } = await sqsClient.send(
    new ReceiveMessageCommand({
      QueueUrl: env.CLICK_EVENTS_QUEUE_URL,
      WaitTimeSeconds: WAIT_TIME_SECONDS,
      MaxNumberOfMessages: MAX_MESSAGES,
    }),
  );

  if (!Messages || Messages.length === 0) {
    return;
  }

  await Promise.all(
    Messages.map(async (message) => {
      try {
        const event = parseClickEventMessage(message.Body ?? '');
        await recordClickEvent(event);

        if (message.ReceiptHandle) {
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: env.CLICK_EVENTS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            }),
          );
        }
      } catch (err) {
        logger.error({ err, messageId: message.MessageId }, 'Failed to process click event');
      }
    }),
  );
}

export async function runConsumerLoop(shouldContinue: () => boolean): Promise<void> {
  while (shouldContinue()) {
    await pollOnce();
  }
}
