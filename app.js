import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import config from './config/index.js';
import startQueues from './src/queues/index.js';
import logger from './src/utils/logger.js';

const PORT = config.app.port;

try {
  await startQueues();

  app.listen(PORT, () => {
    logger.info({ message: `WebCapture running on port ${PORT}` });
  });
} catch (error) {
  logger.error({
    message: 'Failed to start application',
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
}
