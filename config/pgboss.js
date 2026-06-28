import { PgBoss } from 'pg-boss';
import logger from '../src/utils/logger.js';

const boss = new PgBoss({
  connectionString: process.env.DIRECT_URL,
  schema: 'pgboss',
});

boss.on('error', (error) => {
  logger.error({
    message: 'PgBoss error',
    error: error.message,
    stack: error.stack,
  });
});

export default boss;