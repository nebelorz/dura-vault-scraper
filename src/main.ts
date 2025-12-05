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
  const sections = config.scraper.sectionsToScrape;

  logger.section('Initializing scraping...');

  const scrapePromises = sections.map(async (section) => {
    try {
      const { entries, logs } = await scrapeHighscore(section);
      return { section, entries, logs, error: null };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        section,
        entries: [],
        logs: [`[${section}] ERROR: Failed to scrape - ${errorMsg}`],
        error,
      };
    }
  });

  const results = await Promise.all(scrapePromises);

  // Log scraped sections outputs
  for (const { logs } of results) {
    for (const line of logs) {
      logger.info(line);
    }
  }

  // Log scraping errors & exit if any
  const failedSections = results.filter((r) => r.error);
  if (failedSections.length > 0) {
    logger.error(
      `\nCritical: Scraping failed for ${failedSections.length} section(s): ${failedSections.map((f) => f.section).join(', ')}`,
    );
    await closePool();
    process.exit(1);
  }

  // Insert into DB
  logger.section('Inserting scraped data into database...');
  for (const { section, entries } of results) {
    if (entries.length > 0) {
      try {
        await insertHighscoreSnapshots(entries, section);
        totalRecords += entries.length;
      } catch (dbError) {
        logger.error(`Failed to insert ${section} into DB:`, dbError);
        errors.push(section);
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
