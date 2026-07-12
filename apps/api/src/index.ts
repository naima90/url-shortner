// Process entrypoint. Builds the app and starts listening.
// Kept separate from app.ts so tests can import the app without opening a port.
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});
