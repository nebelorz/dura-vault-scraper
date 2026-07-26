import { processHighscoreTop } from './db/highscores-data-insert';
import { logger } from '../utils/logger';
import { run } from '../utils/run';

run('HIGHSCORES', async () => {
  logger.section('Highscores daily insert started');
  await processHighscoreTop();
  logger.info('[HIGHSCORES] Daily insert complete');
});
