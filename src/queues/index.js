import boss from '../../config/pgboss.js';
import logger from '../utils/logger.js';
import { screenshotWorker } from './workers/screenshot.worker.js';
import { QUEUE_NAME } from '../../config/constants.js';

const startQueues = async () => {
  try {
    await boss.start();
    logger.info({ message: 'PgBoss started successfully' });

    await boss.work(QUEUE_NAME, screenshotWorker);
    logger.info({ message: `Worker registered for queue: ${QUEUE_NAME}` });

  } catch (error) {
    logger.error({
      message: 'Failed to start PgBoss',
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

export { boss, QUEUE_NAME };
export default startQueues;