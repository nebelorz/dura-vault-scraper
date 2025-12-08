import { mainScraper } from './scraper/main-scraper';
import { mainDb } from './db/main-db';
import { logger } from './utils/logger';

async function main() {
  try {
    const scrapeResults = await mainScraper(); // Runs main scraper function
    await mainDb(scrapeResults); // Runs main DB function
  } catch (err) {
    logger.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
