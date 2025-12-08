import { config } from '../config';
import { fetchHTML } from '../utils/fetch-html';
import { parseHighscore } from './parse-highscore';
import type { HighscoreEntry, HighscoreSection } from '../types';

export async function scrapeHighscore(
  highscoresSection: HighscoreSection,
  pagesToScrap = config.scraper.scrapNumberOfPages,
): Promise<{ entries: HighscoreEntry[]; logs: string[] }> {
  const allEntries: HighscoreEntry[] = [];
  const logs: string[] = [];
  const baseUrl = `${config.scraper.baseUrl}/${highscoresSection}/`;

  logs.push(
    `[${highscoresSection}] Scraping '${highscoresSection}' highscores (${pagesToScrap} pages)`,
  );

  for (let page = 0; page < pagesToScrap; page++) {
    const url = `${baseUrl}${page}`;
    try {
      const html = await fetchHTML(url);
      const entries = parseHighscore(html, highscoresSection);
      allEntries.push(...entries);
      logs.push(
        `[${highscoresSection}] Page ${page}/${pagesToScrap - 1} OK: ${entries.length} records`,
      );
    } catch (error) {
      logs.push(`[${highscoresSection}] ERROR: Error on page ${page}: ${(error as Error).message}`);
      throw error;
    }
  }

  logs.push(`[${highscoresSection}] Scraped records: ${allEntries.length}`);

  return { entries: allEntries, logs };
}
