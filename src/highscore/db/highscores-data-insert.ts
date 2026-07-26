import {
  insertTempHighscoreSnapshots,
  insertTopEntries,
  removeOldSnapshotsFromTempHighscoreSnapshotTable,
} from './repository';
import { HIGHSCORE_SECTIONS } from '../config';
import { logger } from '../../utils/logger';
import type { HighscoreSection } from '../types';

export async function insertHighscoreSnapshots(
  scrapeResults: Array<{ section: HighscoreSection; entries: any[] }>,
): Promise<void> {
  logger.section('Inserting scraped data into temp_highscore_snapshots...');
  const errors: Error[] = [];
  for (const { section, entries } of scrapeResults) {
    if (entries.length > 0) {
      try {
        await insertTempHighscoreSnapshots(entries, section);
      } catch (dbError) {
        logger.error(`Failed to insert ${section} into DB:`, dbError);
        errors.push(dbError instanceof Error ? dbError : new Error(String(dbError)));
      }
    }
  }
  if (errors.length > 0) {
    throw new AggregateError(errors, 'Failed to insert highscore snapshots for some sections');
  }
}

export async function processHighscoreTop(): Promise<void> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const errors: Error[] = [];

  logger.section('Inserting top experience gainers into highscore_top...');
  try {
    await insertTopEntries('experience', today, yesterday, { metric: 'points', direction: 'gainers' });
  } catch (err) {
    logger.error('Failed to insert top experience gainers:', err);
    errors.push(err instanceof Error ? err : new Error(String(err)));
  }

  logger.section('Inserting experience losses into highscore_top...');
  try {
    await insertTopEntries('experience', today, yesterday, { metric: 'points', direction: 'losers' });
  } catch (err) {
    logger.error('Failed to insert experience losses:', err);
    errors.push(err instanceof Error ? err : new Error(String(err)));
  }

  logger.section('Inserting top skill gainers into highscore_top...');
  for (const section of HIGHSCORE_SECTIONS) {
    if (section !== 'experience') {
      try {
        await insertTopEntries(section, today, yesterday, { metric: 'level', direction: 'gainers' });
      } catch (err) {
        logger.error(`Failed to insert top skill gainers for ${section}:`, err);
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  logger.section('Cleaning up old temp_highscore_snapshots...');
  try {
    await removeOldSnapshotsFromTempHighscoreSnapshotTable();
  } catch (err) {
    logger.error('Failed to clean up old temp_highscore_snapshots:', err);
    errors.push(err instanceof Error ? err : new Error(String(err)));
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, 'Failed to complete some highscore top operations');
  }
}
