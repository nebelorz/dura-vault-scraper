import { mainHighscoresScraper } from './scraper/scraper';
import { highscoresDataInsert } from './db/highscores-data-insert';
import { logger } from '../utils/logger';

async function main() {
  try {
    const highscoresScrapeResults = await mainHighscoresScraper();
    await highscoresDataInsert(highscoresScrapeResults);
  } catch (err) {
    logger.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
