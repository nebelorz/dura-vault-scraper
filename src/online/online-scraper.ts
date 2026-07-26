import { mainOnlineScraper } from './scraper/scraper';
import { upsertOnlineSnapshots } from './db/repository';
import { run } from '../utils/run';

run('ONLINE', async () => {
  const entries = await mainOnlineScraper();
  await upsertOnlineSnapshots(entries);
});
