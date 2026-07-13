import { env } from './config/env';
import { logger } from './lib/logger';
import { runConsumerLoop } from './consumer';

let shuttingDown = false;

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, finishing in-flight batch before exit');
  shuttingDown = true;
});

logger.info({ queueUrl: env.CLICK_EVENTS_QUEUE_URL }, 'Worker starting');

runConsumerLoop(() => !shuttingDown)
  .then(() => {
    logger.info('Worker stopped');
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, 'Worker crashed');
    process.exit(1);
  });
