import { pool } from '../../db/pool';
import { logger } from '../../utils/logger';
import type { OnlineEntry } from '../types';

const MAX_TICK_MINUTES = 60;

async function getAndUpdateLastRunAt(client: any): Promise<number> {
  const result = await client.query(`
    WITH old AS (
      SELECT last_run_at FROM online_scraper_metadata WHERE id = 1
    ),
    upd AS (
      UPDATE online_scraper_metadata SET last_run_at = NOW() WHERE id = 1
    )
    SELECT
      CASE
        WHEN old.last_run_at IS NULL THEN 0
        ELSE ROUND(EXTRACT(EPOCH FROM (NOW() - old.last_run_at)) / 60)::int
      END AS delta_minutes
    FROM old
  `);

  const delta: number = result.rows[0]?.delta_minutes ?? 0;
  return Math.min(delta, MAX_TICK_MINUTES);
}

export async function upsertOnlineSnapshots(entries: OnlineEntry[]): Promise<void> {
  if (entries.length === 0) {
    logger.warn('[ONLINE] No entries to upsert');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const delta = await getAndUpdateLastRunAt(client);
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const entry of entries) {
      placeholders.push(
        `($${paramIndex}::varchar, $${paramIndex + 1}::integer, $${paramIndex + 2}::varchar)`,
      );
      values.push(entry.name, entry.level, entry.vocation);
      paramIndex += 3;
    }

    const upsertQuery = `
      INSERT INTO temp_online_snapshots (name, level, vocation, online_time, first_seen_at, last_seen_at)
      SELECT v.name, v.level, v.vocation, 0, DATE_TRUNC('minute', NOW()), DATE_TRUNC('minute', NOW())
      FROM (VALUES ${placeholders.join(', ')}) AS v(name, level, vocation)
      ON CONFLICT (name) DO UPDATE SET
        online_time = temp_online_snapshots.online_time + $${paramIndex}::integer,
        level = EXCLUDED.level,
        vocation = EXCLUDED.vocation,
        last_seen_at = DATE_TRUNC('minute', NOW())
    `;
    values.push(delta);

    const result = await client.query(upsertQuery, values);
    await client.query('COMMIT');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    logger.info(`[ONLINE] Upserted ${result.rowCount} records at ${dateStr} ${timeStr}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[ONLINE] Database error during upsert:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function insertOnlineTop(scrapeDate: Date = new Date()): Promise<void> {
  const client = await pool.connect();
  const dateStr = scrapeDate.toISOString().split('T')[0];

  try {
    await client.query('BEGIN');

    const checkResult = await client.query('SELECT 1 FROM temp_online_snapshots LIMIT 1');
    if (checkResult.rowCount === 0) {
      logger.warn(
        `[ONLINE] No data in temp_online_snapshots for ${dateStr}. Skipping online-data-insert.`,
      );
      await client.query('COMMIT');
      return;
    }

    const insertQuery = `
      INSERT INTO online_top (scrape_date, name, level, vocation, online_time, first_seen_at, last_seen_at)
      SELECT $1::date, name, level, vocation, online_time, first_seen_at, last_seen_at
      FROM temp_online_snapshots
      ORDER BY online_time DESC
      LIMIT 100
      ON CONFLICT (scrape_date, name) DO NOTHING
    `;

    const result = await client.query(insertQuery, [dateStr]);
    await client.query('COMMIT');

    logger.info(
      `[ONLINE] Inserted top ${result.rowCount} online players for ${dateStr} on table online_top`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[ONLINE] Database error during online-data-insert:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function truncateTempOnlineSnapshots(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE TABLE temp_online_snapshots');
    logger.info('[ONLINE] Truncated temp_online_snapshots');
  } catch (error) {
    logger.error('[ONLINE] Error truncating temp_online_snapshots:', error);
    throw error;
  } finally {
    client.release();
  }
}
