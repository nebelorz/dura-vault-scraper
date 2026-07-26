import { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { logger } from '../../utils/logger';
import type { HighscoreEntry, HighscoreSection, Section } from '../types';

export interface TopEntryDelta {
  scrape_date: string;
  section: string;
  level: number;
  points: number | null;
  name: string;
  vocation: string;
  rank: number;
  gain_points: number | null;
  gain_level: number | null;
  gain_rank: number | null;
}

export interface TopEntriesOptions {
  metric: 'points' | 'level';
  direction: 'gainers' | 'losers';
}

export async function removeOldSnapshotsFromTempHighscoreSnapshotTable(): Promise<void> {
  const client = await pool.connect();
  try {
    const query =
      "DELETE FROM temp_highscore_snapshots WHERE scrape_date < CURRENT_DATE - INTERVAL '1 day'";
    const result = await client.query(query);
    if (result.rowCount === 0) {
      logger.info('[HIGHSCORE] No old records found to remove from temp_highscore_snapshots.');
    } else {
      logger.info(
        `[HIGHSCORE] Cleaned up ${result.rowCount} old records from temp_highscore_snapshots.`,
      );
    }
  } catch (error) {
    logger.error('[HIGHSCORE] Error removing old temp snapshots:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function insertTempHighscoreSnapshots(
  entries: HighscoreEntry[],
  section: HighscoreSection,
  scrapeDate: Date = new Date(),
): Promise<void> {
  if (entries.length === 0) {
    logger.info(`[HIGHSCORE] No entries to insert for section '${section}'`);
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dateStr = scrapeDate.toISOString().split('T')[0] as string;
    const values: (string | number | null)[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;
    for (const entry of entries) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`,
      );
      values.push(
        dateStr,
        section,
        entry.level,
        entry.points || null,
        entry.name,
        entry.vocation,
        entry.rank,
      );
      paramIndex += 7;
    }
    const insertQuery = `
			INSERT INTO temp_highscore_snapshots (scrape_date, section, level, points, name, vocation, rank)
			VALUES ${placeholders.join(', ')}
			ON CONFLICT (scrape_date, section, name) DO NOTHING
		`;
    const result = await client.query(insertQuery, values);
    await client.query('COMMIT');
    const insertedCount = result.rowCount || 0;
    if (insertedCount === 0) {
      logger.info(
        `[HIGHSCORE] No new records to insert received from the scraping process for section '${section}' on ${dateStr}.`,
      );
    } else {
      logger.info(
        `[HIGHSCORE] Inserted ${insertedCount}/${entries.length} records for '${section}' on ${dateStr}`,
      );
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(
      `[HIGHSCORE] Database error while inserting '${section}' highscore snapshots:`,
      error,
    );
    throw error;
  } finally {
    client.release();
  }
}

async function insertTopGainersRows(
  client: PoolClient,
  rows: TopEntryDelta[],
  section: Section,
  todayStr: string,
): Promise<void> {
  if (rows.length === 0) return;

  const values: (string | number | null)[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  for (const row of rows) {
    placeholders.push(
      `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9})`,
    );
    values.push(
      todayStr,
      section,
      row.level,
      row.points || null,
      row.name,
      row.vocation,
      row.rank,
      row.gain_points || null,
      row.gain_level || null,
      row.gain_rank || null,
    );
    paramIndex += 10;
  }

  const insertQuery = `
    INSERT INTO highscore_top (scrape_date, section, level, points, name, vocation, rank, gain_points, gain_level, gain_rank)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (scrape_date, section, name) DO NOTHING
  `;

  await client.query('BEGIN');
  await client.query(insertQuery, values);
  await client.query('COMMIT');
}

function describeTopEntries(options: TopEntriesOptions): string {
  if (options.direction === 'gainers' && options.metric === 'points') return 'top gainers';
  if (options.direction === 'gainers' && options.metric === 'level') return 'top skill gainers';
  return 'experience losses';
}

export async function insertTopEntries(
  section: HighscoreSection,
  today: Date,
  yesterday: Date,
  options: TopEntriesOptions,
  numberOfRecords = 100,
): Promise<void> {
  const description = describeTopEntries(options);
  const client = await pool.connect();
  try {
    const todayStr = today.toISOString().split('T')[0] as string;
    const yesterdayStr = yesterday.toISOString().split('T')[0] as string;

    const filterExpr = options.metric === 'points' ? '(t.points - y.points)' : '(t.level - y.level)';
    const filterOp = options.direction === 'gainers' ? '>' : '<';
    const orderField = options.metric === 'points' ? 'gain_points' : 'gain_level';
    const orderDir = options.direction === 'gainers' ? 'DESC' : 'ASC';
    const insertSection: Section = options.direction === 'losers' ? 'experience_loss' : section;

    const checkQuery =
      'SELECT 1 FROM temp_highscore_snapshots WHERE scrape_date = $1 AND section = $2 LIMIT 1;';
    const checkResult = await client.query(checkQuery, [yesterdayStr, section]);
    if (checkResult.rowCount === 0) {
      logger.info(
        `[HIGHSCORE] No data for section '${section}' on previous day (${yesterdayStr}). Skipping ${description} insert for ${todayStr}.`,
      );
      return;
    }

    const query = `
      SELECT
        t.scrape_date,
        t.section,
        t.level,
        t.points,
        t.name,
        t.vocation,
        t.rank,
        (t.points - y.points) AS gain_points,
        (t.level - y.level) AS gain_level,
        (y.rank - t.rank) AS gain_rank
      FROM temp_highscore_snapshots t
      INNER JOIN temp_highscore_snapshots y
        ON y.scrape_date = $1
        AND y.section = t.section
        AND y.name = t.name
      WHERE t.scrape_date = $2
        AND t.section = $3
        AND ${filterExpr} ${filterOp} 0
      ORDER BY ${orderField} ${orderDir}
      LIMIT ${numberOfRecords};
    `;

    const result = await client.query(query, [yesterdayStr, todayStr, section]);
    const rows = result.rows as TopEntryDelta[];

    if (rows.length > 0) {
      await insertTopGainersRows(client, rows, insertSection, todayStr);
      logger.info(
        `[HIGHSCORE] Inserted ${rows.length} ${description} for section '${insertSection}' on ${todayStr}`,
      );
    } else {
      logger.info(`[HIGHSCORE] No ${description} for section '${insertSection}' on ${todayStr}`);
    }
  } catch (error) {
    logger.error(`[HIGHSCORE] Error inserting ${description} for section '${section}':`, error);
    throw error;
  } finally {
    client.release();
  }
}
