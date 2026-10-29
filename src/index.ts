// Loads the .env file, keep it as the first import
import './env.js';
import { getLogger, shutdownLogger } from './logger.js';
import { start, stop } from './bot/start.js';

const logger = getLogger('Main');

async function exit(code: number) {
  await stop().catch((err) => logger.error('Errored while stopping the bot', err));
  await shutdownLogger();
  process.exit(code);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    logger.info(`Received ${signal}, shutting down`);
    void exit(0);
  });
}

start().catch((err) => {
  logger.fatal('Failed to start the bot', err);
  void exit(1);
});
