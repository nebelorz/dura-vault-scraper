import { logger } from './utils/logger';
import { scrapeHighscore } from './core';

async function main() {
  logger.info('Starting highscores scraping...');
  const results = await scrapeHighscore('experience');
  logger.info(`Total records fetched: ${results.length}`);
  logger.info('First 3 records:', results.slice(0, 3));
}

main().catch((err) => {
  logger.error('Scraper error:', err);
});
