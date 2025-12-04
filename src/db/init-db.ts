import { Client } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';
import { queryCreateHighscoreSnapshotsTable, queryCreateIndexes } from './schema';

async function main() {
  const client = new Client(config.database);
  try {
    await client.connect();
    logger.info('Connected to PostgreSQL');

    await client.query(queryCreateHighscoreSnapshotsTable);
    logger.info('Table highscore_snapshots is ready');

    await client.query(queryCreateIndexes);
    logger.info('Indexes created successfully');
  } catch (err) {
    logger.error('Error initializing DB:', err);
  } finally {
    await client.end();
  }
}

main();
