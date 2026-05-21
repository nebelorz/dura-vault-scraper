import { insertOnlineTop, truncateTempOnlineSnapshots } from './db/repository';
import { closePool } from '../db/pool';
import { logger } from '../utils/logger';

async function main() {
  const today = new Date();
  try {
    logger.section('Online daily insert started');
    await insertOnlineTop(today);
    await truncateTempOnlineSnapshots();
    logger.info('[ONLINE] Daily insert complete');
  } catch (err) {
    logger.error('[ONLINE] Fatal error during daily insert:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
