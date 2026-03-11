import { mainOnlineScraper } from './scraper/scraper';
import { upsertOnlineSnapshots } from './db/repository';
import { closePool } from '../db/pool';
import { logger } from '../utils/logger';

async function main() {
  try {
    const entries = await mainOnlineScraper();
    await upsertOnlineSnapshots(entries);
  } catch (err) {
    logger.error('[ONLINE] Fatal error:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
