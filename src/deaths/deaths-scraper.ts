import { mainDeathsScraper } from './scraper';
import { insertDeaths } from './db/repository';
import { run } from '../utils/run';

run('DEATHS', async () => {
  const entries = await mainDeathsScraper();
  await insertDeaths(entries);
});
