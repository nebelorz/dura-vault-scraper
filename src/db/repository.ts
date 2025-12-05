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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO highscore_snapshots (scrape_date, section, rank, name, vocation, level, points)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (scrape_date, section, name) DO NOTHING
    `;

    let insertedCount = 0;

    for (const entry of entries) {
      const values = [
        scrapeDate.toISOString().split('T')[0], // YYYY-MM-DD
        section,
        entry.rank,
        entry.name,
        entry.vocation,
        entry.level,
        entry.points || null,
      ];

      const result = await client.query(insertQuery, values);
      if (result.rowCount && result.rowCount > 0) {
        insertedCount++;
      }
    }

    await client.query('COMMIT');
    logger.info(
      `Inserted ${insertedCount} records for '${section}' highscores for date ${scrapeDate.toISOString().split('T')[0]}`,
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
