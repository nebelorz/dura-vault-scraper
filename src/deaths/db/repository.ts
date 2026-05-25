import { pool } from '../../db/pool';
import { logger } from '../../utils/logger';
import { config } from '../config';
import type { DeathEntry } from '../types';

export async function insertDeaths(entries: DeathEntry[]): Promise<void> {
  if (entries.length === 0) {
    logger.warn('[DEATHS] No entries to insert');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const values: (string | number | boolean)[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const entry of entries) {
      const diedAtWithTz = `${entry.diedAt} ${config.serverTimezone}`;
      placeholders.push(
        `($${paramIndex}::varchar, $${paramIndex + 1}::varchar, $${paramIndex + 2}::smallint, $${paramIndex + 3}::timestamptz, $${paramIndex + 4}::boolean)`,
      );
      values.push(entry.playerName, entry.killerName, entry.playerLevel, diedAtWithTz, entry.isPvp);
      paramIndex += 5;
    }

    const query = `
      INSERT INTO deaths (player_name, killer_name, player_level, died_at, is_pvp)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (player_name, died_at) DO NOTHING
    `;

    const result = await client.query(query, values);
    await client.query('COMMIT');

    const inserted = result.rowCount ?? 0;
    const skipped = entries.length - inserted;
    logger.info(`[DEATHS] Inserted ${inserted} new deaths (${skipped} duplicates skipped)`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[DEATHS] Database error during insert:', error);
    throw error;
  } finally {
    client.release();
  }
}
