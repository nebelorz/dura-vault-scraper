import { closePool, insertTempHighscoreSnapshots, insertTop25Gainers } from '.';
import { logger } from '../utils/logger';
import type { HighscoreSection } from '../types';

/**
 * Inserts scraped data into the database tables.
 * First inserts raw entries into temp_highscore_snapshots, then calculates and inserts top 25 gainers.
 * Closes the database connection at the end.
 *
 * @param {Array<{ section: HighscoreSection; entries: any[] }>} scrapeResults
 *   Array of results from the scraper, each with a section and its entries.
 * @returns {Promise<void>}
 */
export async function mainDb(scrapeResults: Array<{ section: HighscoreSection; entries: any[] }>) {
  // Insert raw data into temp_highscore_snapshots table
  logger.section('Inserting scraped data into temp_highscore_snapshots table...');
  for (const { section, entries } of scrapeResults) {
    if (entries.length > 0) {
      try {
        await insertTempHighscoreSnapshots(entries, section);
      } catch (dbError) {
        logger.error(`Failed to insert ${section} into DB:`, dbError);
      }
    }
  }

  // Insert top 25 gainers into highscore_top25 table
  logger.section('Inserting top 25 gainers into highscore_top25 table...');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (const { section } of scrapeResults) {
    try {
      await insertTop25Gainers(section, today, yesterday);
    } catch (err) {
      logger.error(`Failed to insert top 25 for section ${section}:`, err);
    }
  }

  await closePool();
  logger.info('Database connection closed');
}
