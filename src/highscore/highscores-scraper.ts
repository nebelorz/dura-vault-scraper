import { mainHighscoresScraper } from './scraper/scraper';
import { insertHighscoreSnapshots } from './db/highscores-data-insert';
import { closePool } from '../db/pool';
import { logger } from '../utils/logger';

async function main() {
  try {
    const scrapeResults = await mainHighscoresScraper();
    await insertHighscoreSnapshots(scrapeResults);
  } catch (err) {
    logger.error('[HIGHSCORES] Fatal error:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
