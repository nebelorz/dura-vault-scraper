import { config } from '../config';
import { fetchHTML } from '../utils/fetch-html';
import { logger } from '../utils/logger';
import { parseHighscore } from './parse-highscore';
import type { HighscoreEntry, HighscoreSection } from '../types';

export async function scrapeHighscore(
  highscoresSection: HighscoreSection,
  pagesToScrap = config.scraper.scrapNumberOfPages,
): Promise<HighscoreEntry[]> {
  const allEntries: HighscoreEntry[] = [];
  const baseUrl = `${config.scraper.baseUrl}/${highscoresSection}/`;

  logger.section(`Scraping '${highscoresSection}' highscores (${pagesToScrap} pages)`);

  for (let page = 0; page < pagesToScrap; page++) {
    const url = `${baseUrl}${page}`;
    try {
      const html = await fetchHTML(url);
      const entries = parseHighscore(html);
      allEntries.push(...entries);
      logger.info(`Page ${page}/${pagesToScrap - 1} OK: ${entries.length} records`);
    } catch (error) {
      logger.error(`Error on page ${page}:`, error);
    }
  }

  logger.info(`Scraped records: ${allEntries.length}`);

  return allEntries;
}
