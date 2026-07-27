import { Client } from 'pg';
import { dbConfig } from './config';
import { closePool } from './pool';
import { logger } from '../utils/logger';
import {
  queryCreateTempHighscoreSnapshotsTable,
  queryCreateHighscoreIndexes,
  queryCreateTopHighscoreTable,
} from '../highscore/db/schema';
import {
  queryCreateTempOnlineSnapshotsTable,
  queryCreateOnlineTopTable,
  queryCreateOnlineIndexes,
  queryCreateOnlineScraperMetadataTable,
} from '../online/db/schema';
import { queryCreateDeathsTable, queryCreateDeathsIndexes } from '../deaths/db/schema';
import { removeOldSnapshotsFromTempHighscoreSnapshotTable } from '../highscore/db/repository';

async function main() {
  const client = new Client(dbConfig);
  try {
    logger.section('Initializing database...');
    await client.connect();
    await client.query('SET search_path TO data');
    logger.info(
      `Connected to PostgreSQL (${dbConfig.host}:${dbConfig.port}) - (${dbConfig.database})`,
    );

    // |||||||||||||||||||
    // || CREATE TABLES ||
    // |||||||||||||||||||
    logger.section('Creating tables if needed...');

    // Highscore
    await client.query(queryCreateTopHighscoreTable);
    logger.info('[HIGHSCORE] Table highscore_top OK');
    await client.query(queryCreateTempHighscoreSnapshotsTable);
    logger.info('[HIGHSCORE] Table temp_highscore_snapshots OK');

    // Online
    await client.query(queryCreateOnlineTopTable);
    logger.info('[ONLINE] Table online_top OK');
    await client.query(queryCreateTempOnlineSnapshotsTable);
    logger.info('[ONLINE] Table temp_online_snapshots OK');
    await client.query(queryCreateOnlineScraperMetadataTable);
    logger.info('[ONLINE] Table online_scraper_metadata OK');

    // Deaths
    await client.query(queryCreateDeathsTable);
    logger.info('[DEATHS] Table deaths OK');

    // ||||||||||||||||||||
    // || CREATE INDEXES ||
    // ||||||||||||||||||||
    logger.section('Creating indexes if needed...');

    // Highscore
    await client.query(queryCreateHighscoreIndexes);
    logger.info('[HIGHSCORE] Indexes OK');

    // Online
    await client.query(queryCreateOnlineIndexes);
    logger.info('[ONLINE] Indexes OK');

    // Deaths
    await client.query(queryCreateDeathsIndexes);
    logger.info('[DEATHS] Indexes OK');

    // ||||||||||||||
    // || CLEAN-UP ||
    // ||||||||||||||
    logger.section('Deleting old data if needed...');

    // Highscore
    await removeOldSnapshotsFromTempHighscoreSnapshotTable();
  } catch (err) {
    throw new Error('Database initialization failed', { cause: err });
  } finally {
    logger.section('Database initialization completed');
    await client.end();
    await closePool();
  }
}

main();
