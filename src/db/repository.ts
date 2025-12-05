import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { HighscoreEntry, HighscoreSection } from '../types';

const pool = new Pool(config.database);

export async function insertHighscoreSnapshots(
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
        entry.rank,
        entry.name,
        entry.vocation,
        entry.level,
        entry.points || null,
      );

      paramIndex += 7;
    }

    // Insert query
    const insertQuery = `
      INSERT INTO highscore_snapshots (scrape_date, section, rank, name, vocation, level, points)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (scrape_date, section, name) DO NOTHING
    `;

    const result = await client.query(insertQuery, values);
    await client.query('COMMIT');

    const insertedCount = result.rowCount || 0;
    logger.info(
      `Inserted ${insertedCount}/${entries.length} records for '${section}' on ${dateStr}`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Database error while inserting '${section}' highscore snapshots:`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
