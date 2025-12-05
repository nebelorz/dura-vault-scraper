import { logger } from './utils/logger';
import { scrapeHighscore } from './core';
import { closePool, insertHighscoreSnapshots } from './db';
import { config } from './config';

function logScrapingSummary(totalRecords: number, errors: string[]) {
  logger.section('Scraping completed');
  logger.info(`Total records: ${totalRecords}`);
  logger.info(
    `Sections scraped: ${config.scraper.sectionsToScrape.length - errors.length}/${config.scraper.sectionsToScrape.length}`,
  );
  if (errors.length > 0) {
    logger.warn(`Failed sections: ${errors.join(', ')}`);
  }
}

async function main() {
  let totalRecords = 0;
  const errors: string[] = [];
  const logsBySection: Record<string, string[]> = {};

  for (const section of config.scraper.sectionsToScrape) {
    try {
      const { entries, logs } = await scrapeHighscore(section);
      logsBySection[section] = logs;

      // Insert into DB
      if (entries.length > 0) {
        await insertHighscoreSnapshots(entries, section);
      }

      totalRecords += entries.length;
    } catch (error) {
      logger.error(`Failed to scrape ${section}:`, error);
      errors.push(section);
    }
  }

  // Log scraper outputs
  for (const section of config.scraper.sectionsToScrape) {
    if (logsBySection[section]) {
      for (const line of logsBySection[section]) {
        logger.info(line);
      }
    }
  }

  // Log scraping summary
  logScrapingSummary(totalRecords, errors);
  await closePool();
  logger.info('Database connection closed');
}

main().catch((err) => {
  logger.error('Scraper error:', err);
  process.exit(1);
});
