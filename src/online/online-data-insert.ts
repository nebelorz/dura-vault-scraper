import { insertOnlineTop, truncateTempOnlineSnapshots } from './db/repository';
import { closePool } from '../db/pool';
import { logger } from '../utils/logger';

async function main() {
  const today = new Date();
  try {
    logger.section('Online data insert started');
    await insertOnlineTop(today);
    await truncateTempOnlineSnapshots();
    logger.info('[ONLINE] Online data insert complete');
  } catch (err) {
    logger.error('[ONLINE] Fatal error during online data insert:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
