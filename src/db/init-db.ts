import { Client } from 'pg';
import { dbConfig } from './config';
import { logger } from '../utils/logger';
import {
  queryCreateTempHighscoreSnapshotsTable,
  queryCreateIndexes,
  queryCreateTopHighscoreTable,
} from '../highscore/db/schema';
import {
  removeOldSnapshotsFromTempHighscoreSnapshotTable,
  closePool,
} from '../highscore/db/repository';

async function main() {
  const client = new Client(dbConfig);
  try {
    logger.section('Initializing database...');
    await client.connect();
    logger.info(
      `Connected to PostgreSQL (${dbConfig.host}:${dbConfig.port}) - (${dbConfig.database})`,
    );

    logger.section('Creating tables if doesnt exist...');

    // Highscore tables
    await client.query(queryCreateTempHighscoreSnapshotsTable);
    logger.info('Table temp_highscore_snapshots OK');
    await client.query(queryCreateTopHighscoreTable);
    logger.info('Table highscore_top OK');

    // Highscore indexes
    logger.section('Creating indexes if doesnt exist...');
    await client.query(queryCreateIndexes);
    logger.info('Indexes OK');

    // Highscore cleanup
    logger.section('Deleting old data if needed...');
    await removeOldSnapshotsFromTempHighscoreSnapshotTable();

    // Online tables (TBD)
    // ...

    logger.section('Database initialization completed');
  } catch (err) {
    throw new Error('Database initialization failed', { cause: err });
  } finally {
    await client.end();
    await closePool();
  }
}

main();
