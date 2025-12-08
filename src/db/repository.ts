import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { HighscoreEntry, HighscoreSection } from '../types';

const pool = new Pool(config.database);

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
      logger.info('No old records found to remove from temp_highscore_snapshots.');
    } else {
      logger.info(`Cleaned up ${result.rowCount} old records from temp_highscore_snapshots.`);
    }
  } catch (error) {
    logger.error('Error removing old temp snapshots:', error);
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
    logger.warn(`No entries to insert for section '${section}'`);
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

    // Insert query
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
        `No new records to insert received from the scraping process for section '${section}' on ${dateStr}.`,
      );
    } else {
      logger.info(
        `Inserted ${insertedCount}/${entries.length} records for '${section}' on ${dateStr}`,
      );
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Database error while inserting '${section}' highscore snapshots:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Calculates the top 25 gainers for a section and date, and inserts them into highscore_top25.
 * Only inserts players with a gain > 0 (points for experience, level for other sections).
 */
export async function insertTop25Gainers(
  section: HighscoreSection,
  today: Date,
  yesterday: Date,
): Promise<void> {
  const client = await pool.connect();
  try {
    // Format dates as YYYY-MM-DD
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if there is data for yesterday
    const checkQuery =
      'SELECT 1 FROM temp_highscore_snapshots WHERE scrape_date = $1 AND section = $2 LIMIT 1;';
    const checkResult = await client.query(checkQuery, [yesterdayStr, section]);
    if (checkResult.rowCount === 0) {
      logger.warn(
        `No data for section '${section}' on previous day (${yesterdayStr}). Skipping top 25 insert for ${todayStr}.`,
      );
      return;
    }

    // Calculate gain and get top 25
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
      ORDER BY gain_points DESC
      LIMIT 25;
    `;

    const result = await client.query(query, [yesterdayStr, todayStr, section]);
    const rows = result.rows.filter((row) => row.gain_points > 0 || row.gain_level > 0);

    if (rows.length === 0) {
      logger.info(`No top 25 gainers with positive gain for section '${section}' on ${todayStr}`);
      return;
    }

    // Insert for highscore_top25
    const insertValues: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;
    for (const row of rows) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9})`,
      );
      insertValues.push(
        row.scrape_date,
        row.section,
        row.level,
        row.points,
        row.name,
        row.vocation,
        row.rank,
        row.gain_points,
        row.gain_level,
        row.gain_rank,
      );
      paramIndex += 10;
    }

    const insertQuery = `
      INSERT INTO highscore_top25 (
        scrape_date, section, level, points, name, vocation, rank, gain_points, gain_level, gain_rank
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT (scrape_date, section, name) DO NOTHING
    `;

    await client.query(insertQuery, insertValues);
    logger.info(`Inserted ${rows.length} top gainers for section '${section}' on ${todayStr}`);
  } catch (error) {
    logger.error(`Error inserting top 25 gainers for section '${section}':`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
