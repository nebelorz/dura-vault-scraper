import { closePool } from '../db/pool';
import { logger } from './logger';

export async function run(tag: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.error(`[${tag}] Fatal error:`, err);
    process.exit(1);
  } finally {
    await closePool();
  }
}
