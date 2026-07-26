import { insertOnlineTop, truncateTempOnlineSnapshots } from './db/repository';
import { logger } from '../utils/logger';
import { run } from '../utils/run';

run('ONLINE', async () => {
  const today = new Date();
  logger.section('Online daily insert started');
  await insertOnlineTop(today);
  await truncateTempOnlineSnapshots();
  logger.info('[ONLINE] Daily insert complete');
});
