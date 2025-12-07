import { Client } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  queryCreateTempHighscoreSnapshotsTable,
  queryCreateIndexes,
  queryCreateTop25HighscoreTable,
} from './schema';

async function main() {
  const client = new Client(config.database);
  try {
    logger.section('Initializing database...');
    await client.connect();
    logger.info(
      `Connected to PostgreSQL (${config.database.host}:${config.database.port}) - (${config.database.database})`,
    );

    logger.info('## Creating tables...');
    await client.query(queryCreateTempHighscoreSnapshotsTable);
    logger.info('Table temp_highscore_snapshots created successfully');
    await client.query(queryCreateTop25HighscoreTable);
    logger.info('Table highscore_top25 created successfully');

    logger.info('## Creating indexes...');
    await client.query(queryCreateIndexes);
    logger.info('Indexes created successfully');

    logger.info('Database initialization completed');
  } catch (err) {
    throw new Error('Database initialization failed', { cause: err });
  } finally {
    await client.end();
  }
}

main();
