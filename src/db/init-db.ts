import { Client } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  queryCreateTempHighscoreSnapshotsTable,
  queryCreateIndexes,
  queryCreateTop25HighscoreTable,
} from './schema';
import { removeOldSnapshotsFromTempHighscoreSnapshotTable } from '.';

async function main() {
  const client = new Client(config.database);
  try {
    logger.section('Initializing database...');
    await client.connect();
    logger.info(
      `Connected to PostgreSQL (${config.database.host}:${config.database.port}) - (${config.database.database})`,
    );

    logger.section('Creating tables if doesnt exist...');
    await client.query(queryCreateTempHighscoreSnapshotsTable);
    logger.info('Table temp_highscore_snapshots OK');
    await client.query(queryCreateTop25HighscoreTable);
    logger.info('Table highscore_top25 OK');

    logger.section('Creating indexes if doesnt exist...');
    await client.query(queryCreateIndexes);
    logger.info('Indexes OK');

    logger.section('Deleting old data if needed...');
    await removeOldSnapshotsFromTempHighscoreSnapshotTable();

    logger.section('Database initialization completed');
  } catch (err) {
    throw new Error('Database initialization failed', { cause: err });
  } finally {
    await client.end();
  }
}

main();
