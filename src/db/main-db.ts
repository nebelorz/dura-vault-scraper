import {
  closePool,
  insertTempHighscoreSnapshots,
  insertTopGainers,
  insertTopSkillGainers,
  insertExperienceLosses,
} from '.';
import { logger } from '../utils/logger';
import type { HighscoreSection } from '../types';

/**
 * Inserts scraped data into the database tables.
 * First inserts raw entries into temp_highscore_snapshots, then calculates and inserts top gainers.
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

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Insert top experience gainers into highscore_top table
  logger.section('Inserting top experience gainers into highscore_top table...');
  try {
    await insertTopGainers(today, yesterday);
  } catch (err) {
    logger.error('Failed to insert top experience gainers:', err);
  }

  // Insert experience losses into highscore_top table
  logger.section('Inserting experience losses into highscore_top table...');
  try {
    await insertExperienceLosses(today, yesterday);
  } catch (err) {
    logger.error('Failed to insert experience losses:', err);
  }

  // Insert top skill gainers into highscore_top table
  logger.section('Inserting top skill gainers into highscore_top table...');
  for (const { section } of scrapeResults) {
    if (section !== 'experience') {
      try {
        await insertTopSkillGainers(section, today, yesterday);
      } catch (err) {
        logger.error(`Failed to insert top skill gainers for section ${section}:`, err);
      }
    }
  }

  await closePool();
  logger.info('Database connection closed');
}
