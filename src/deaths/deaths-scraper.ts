import { mainDeathsScraper } from './scraper';
import { insertDeaths } from './db/repository';
import { closePool } from '../db/pool';
import { logger } from '../utils/logger';

async function main() {
  try {
    const entries = await mainDeathsScraper();
    await insertDeaths(entries);
  } catch (err) {
    logger.error('[DEATHS] Fatal error:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
