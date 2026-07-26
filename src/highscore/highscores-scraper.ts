import { mainHighscoresScraper } from './scraper/scraper';
import { insertHighscoreSnapshots } from './db/highscores-data-insert';
import { run } from '../utils/run';

run('HIGHSCORES', async () => {
  const scrapeResults = await mainHighscoresScraper();
  await insertHighscoreSnapshots(scrapeResults);
});
