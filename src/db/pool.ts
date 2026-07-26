import { Pool } from 'pg';
import { dbConfig } from './config';
import { logger } from '../utils/logger';

export const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing pool');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing pool');
  await closePool();
  process.exit(0);
});

export async function closePool() {
  await pool.end();
}
