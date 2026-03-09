import {
  closePool,
  insertTempHighscoreSnapshots,
  insertTopGainers,
  insertTopSkillGainers,
  insertExperienceLosses,
} from './repository';
import { logger } from '../../utils/logger';
import type { HighscoreSection } from '../types';

export async function highscoresDataInsert(
  scrapeResults: Array<{ section: HighscoreSection; entries: any[] }>,
) {
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

  // Experience gainers
  logger.section('Inserting top experience gainers into highscore_top table...');
  try {
    await insertTopGainers(today, yesterday);
  } catch (err) {
    logger.error('Failed to insert top experience gainers:', err);
  }

  // Experience losses
  logger.section('Inserting experience losses into highscore_top table...');
  try {
    await insertExperienceLosses(today, yesterday);
  } catch (err) {
    logger.error('Failed to insert experience losses:', err);
  }

  // Skill gainers
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
}
