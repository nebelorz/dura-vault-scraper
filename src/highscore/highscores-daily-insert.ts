import { processHighscoreTop } from './db/highscores-data-insert';
import { closePool } from '../db/pool';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.section('Highscores daily insert started');
    await processHighscoreTop();
    logger.info('[HIGHSCORES] Daily insert complete');
  } catch (err) {
    logger.error('[HIGHSCORES] Fatal error during daily insert:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
