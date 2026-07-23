import {
  insertTempHighscoreSnapshots,
  insertTopGainers,
  insertTopSkillGainers,
  insertExperienceLosses,
  removeOldSnapshotsFromTempHighscoreSnapshotTable,
} from './repository';
import { HIGHSCORE_SECTIONS } from '../config';
import { logger } from '../../utils/logger';
import type { HighscoreSection } from '../types';

export async function insertHighscoreSnapshots(
  scrapeResults: Array<{ section: HighscoreSection; entries: any[] }>,
): Promise<void> {
  logger.section('Inserting scraped data into temp_highscore_snapshots...');
  for (const { section, entries } of scrapeResults) {
    if (entries.length > 0) {
      try {
        await insertTempHighscoreSnapshots(entries, section);
      } catch (dbError) {
        logger.error(`Failed to insert ${section} into DB:`, dbError);
      }
    }
  }
}

export async function processHighscoreTop(): Promise<void> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  logger.section('Inserting top experience gainers into highscore_top...');
  try {
    await insertTopGainers(today, yesterday);
  } catch (err) {
    logger.error('Failed to insert top experience gainers:', err);
  }

  logger.section('Inserting experience losses into highscore_top...');
  try {
    await insertExperienceLosses(today, yesterday);
  } catch (err) {
    logger.error('Failed to insert experience losses:', err);
  }

  logger.section('Inserting top skill gainers into highscore_top...');
  for (const section of HIGHSCORE_SECTIONS) {
    if (section !== 'experience') {
      try {
        await insertTopSkillGainers(section, today, yesterday);
      } catch (err) {
        logger.error(`Failed to insert top skill gainers for ${section}:`, err);
      }
    }
  }

  logger.section('Cleaning up old temp_highscore_snapshots...');
  try {
    await removeOldSnapshotsFromTempHighscoreSnapshotTable();
  } catch (err) {
    logger.error('Failed to clean up old temp_highscore_snapshots:', err);
  }
}
