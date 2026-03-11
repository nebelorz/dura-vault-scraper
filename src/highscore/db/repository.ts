import { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { logger } from '../../utils/logger';
import type { HighscoreEntry, HighscoreSection, Section } from '../types';

/**
 * Removes old records from the temp_highscore_snapshots table.
 * Removes records older than 1 day.
 */
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
    const dateStr = scrapeDate.toISOString().split('T')[0];
    const values: any[] = [];
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
  rows: any[],
  section: Section,
  todayStr: string,
): Promise<void> {
  if (rows.length === 0) return;

  const values: any[] = [];
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

export async function insertTopGainers(
  today: Date,
  yesterday: Date,
  numberOfRecords = 100,
): Promise<void> {
  const client = await pool.connect();
  try {
    const todayStr = today.toISOString().split('T')[0] as string;
    const yesterdayStr = yesterday.toISOString().split('T')[0] as string;

    const checkQuery =
      'SELECT 1 FROM temp_highscore_snapshots WHERE scrape_date = $1 AND section = $2 LIMIT 1;';
    const checkResult = await client.query(checkQuery, [yesterdayStr, 'experience']);
    if (checkResult.rowCount === 0) {
      logger.info(
        `[HIGHSCORE] No data for section 'experience' on previous day (${yesterdayStr}). Skipping top gainers insert for ${todayStr}.`,
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
        AND t.section = 'experience'
        AND (t.points - y.points) > 0
      ORDER BY gain_points DESC
      LIMIT ${numberOfRecords};
    `;

    const result = await client.query(query, [yesterdayStr, todayStr]);
    const gainsRows = result.rows;

    if (gainsRows.length > 0) {
      await insertTopGainersRows(client, gainsRows, 'experience', todayStr);
      logger.info(
        `[HIGHSCORE] Inserted ${gainsRows.length} top gainers for section 'experience' on ${todayStr}`,
      );
    } else {
      logger.info(`[HIGHSCORE] No top gainers for section 'experience' on ${todayStr}`);
    }
  } catch (error) {
    logger.error("[HIGHSCORE] Error inserting top gainers for section 'experience':", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function insertTopSkillGainers(
  section: HighscoreSection,
  today: Date,
  yesterday: Date,
  numberOfRecords = 100,
): Promise<void> {
  if (section === 'experience') return;

  const client = await pool.connect();
  try {
    const todayStr = today.toISOString().split('T')[0] as string;
    const yesterdayStr = yesterday.toISOString().split('T')[0] as string;

    const checkQuery =
      'SELECT 1 FROM temp_highscore_snapshots WHERE scrape_date = $1 AND section = $2 LIMIT 1;';
    const checkResult = await client.query(checkQuery, [yesterdayStr, section]);
    if (checkResult.rowCount === 0) {
      logger.warn(
        `[HIGHSCORE] No data for section '${section}' on previous day (${yesterdayStr}). Skipping top skill gainers insert for ${todayStr}.`,
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
        AND (t.level - y.level) > 0
      ORDER BY gain_level DESC
      LIMIT ${numberOfRecords};
    `;

    const result = await client.query(query, [yesterdayStr, todayStr, section]);
    const gainsRows = result.rows;

    if (gainsRows.length > 0) {
      await insertTopGainersRows(client, gainsRows, section, todayStr);
      logger.info(
        `[HIGHSCORE] Inserted ${gainsRows.length} top skill gainers for section '${section}' on ${todayStr}`,
      );
    } else {
      logger.info(`[HIGHSCORE] No top skill gainers for section '${section}' on ${todayStr}`);
    }
  } catch (error) {
    logger.error(`[HIGHSCORE] Error inserting top skill gainers for section '${section}':`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function insertExperienceLosses(
  today: Date,
  yesterday: Date,
  numberOfRecords = 100,
): Promise<void> {
  const client = await pool.connect();
  try {
    const todayStr = today.toISOString().split('T')[0] as string;
    const yesterdayStr = yesterday.toISOString().split('T')[0] as string;

    const checkQuery =
      'SELECT 1 FROM temp_highscore_snapshots WHERE scrape_date = $1 AND section = $2 LIMIT 1;';
    const checkResult = await client.query(checkQuery, [yesterdayStr, 'experience']);
    if (checkResult.rowCount === 0) {
      logger.warn(
        `[HIGHSCORE] No data for section 'experience' on previous day (${yesterdayStr}). Skipping experience losses insert for ${todayStr}.`,
      );
      return;
    }

    const lossesQuery = `
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
        AND t.section = 'experience'
        AND (t.points - y.points) < 0
      ORDER BY gain_points ASC
      LIMIT ${numberOfRecords};
    `;

    const result = await client.query(lossesQuery, [yesterdayStr, todayStr]);
    const lossesRows = result.rows;

    if (lossesRows.length > 0) {
      await insertTopGainersRows(client, lossesRows, 'experience_loss', todayStr);
      logger.info(
        `[HIGHSCORE] Inserted ${lossesRows.length} experience losses in 'experience_loss' section on ${todayStr}`,
      );
    } else {
      logger.info(`[HIGHSCORE] No experience losses on ${todayStr}`);
    }
  } catch (error) {
    logger.error('[HIGHSCORE] Error inserting experience losses:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
