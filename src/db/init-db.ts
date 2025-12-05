import { Client } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';
import { queryCreateHighscoreSnapshotsTable, queryCreateIndexes } from './schema';

async function main() {
  const client = new Client(config.database);
  try {
    logger.section('Initializing database...');
    await client.connect();
    logger.info(`Connected to PostgreSQL (${config.database.host}:${config.database.port}) - (${config.database.database})`);

    logger.info('## Creating tables...');
    await client.query(queryCreateHighscoreSnapshotsTable);
    logger.info('Table highscore_snapshots created successfully');

    logger.info('## Creating indexes...');
    await client.query(queryCreateIndexes);
    logger.info('Indexes created successfully');

    logger.section('Database initialization completed');
  } catch (err) {
    logger.error('Error initializing DB:', err);
  } finally {
    await client.end();
  }
}

main();
