import { pool } from '../../db/pool';
import { logger } from '../../utils/logger';
import type { OnlineEntry } from '../types';

const MAX_TICK_MINUTES = 20;

async function getAndUpdateLastRunAt(client: any): Promise<number> {
  const selectResult = await client.query(
    'SELECT last_run_at FROM online_scraper_metadata WHERE id = 1',
  );
  const lastRunAt: Date | null = selectResult.rows[0]?.last_run_at ?? null;

  await client.query('UPDATE online_scraper_metadata SET last_run_at = NOW() WHERE id = 1');

  if (!lastRunAt) return 0;

  const deltaMinutes = Math.round((Date.now() - lastRunAt.getTime()) / 60000);
  return Math.min(deltaMinutes, MAX_TICK_MINUTES);
}

export async function upsertOnlineSnapshots(
  entries: OnlineEntry[],
  scrapeDate: Date = new Date(),
): Promise<void> {
  if (entries.length === 0) {
    logger.warn('[ONLINE] No entries to upsert');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dateStr = scrapeDate.toISOString().split('T')[0];
    const delta = await getAndUpdateLastRunAt(client);
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const entry of entries) {
      placeholders.push(
        `($${paramIndex}::date, $${paramIndex + 1}::varchar, $${paramIndex + 2}::integer, $${paramIndex + 3}::varchar)`,
      );
      values.push(dateStr, entry.name, entry.level, entry.vocation);
      paramIndex += 4;
    }

    const upsertQuery = `
      INSERT INTO temp_online_snapshots (scrape_date, name, level, vocation, online_time, first_seen_at, last_seen_at)
      SELECT v.scrape_date, v.name, v.level, v.vocation, 0, DATE_TRUNC('minute', NOW()), DATE_TRUNC('minute', NOW())
      FROM (VALUES ${placeholders.join(', ')}) AS v(scrape_date, name, level, vocation)
      ON CONFLICT (scrape_date, name) DO UPDATE SET
        online_time = temp_online_snapshots.online_time + $${paramIndex}::integer,
        level = EXCLUDED.level,
        vocation = EXCLUDED.vocation,
        last_seen_at = DATE_TRUNC('minute', NOW())
    `;
    values.push(delta);

    const result = await client.query(upsertQuery, values);
    await client.query('COMMIT');

    const timeStr = scrapeDate.toTimeString().slice(0, 5);
    logger.info(`[ONLINE] Upserted ${result.rowCount} records for ${dateStr} ${timeStr}`);
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

    const checkResult = await client.query(
      'SELECT 1 FROM temp_online_snapshots WHERE scrape_date = $1 LIMIT 1',
      [dateStr],
    );
    if (checkResult.rowCount === 0) {
      logger.warn(
        `[ONLINE] No data in temp_online_snapshots for ${dateStr}. Skipping online-data-insert.`,
      );
      await client.query('COMMIT');
      return;
    }

    const insertQuery = `
      INSERT INTO online_top (scrape_date, name, level, vocation, online_time, first_seen_at, last_seen_at)
      SELECT scrape_date, name, level, vocation, online_time, first_seen_at, last_seen_at
      FROM temp_online_snapshots
      WHERE scrape_date = $1
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
