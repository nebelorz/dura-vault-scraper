import { config } from '../config';
import { fetchHTML } from '../../utils/fetch-html';
import { parseHighscore } from './parse';
import { logger } from '../../utils/logger';
import type { HighscoreEntry, HighscoreSection } from '../types';

async function scrapeHighscore(
  highscoresSection: HighscoreSection,
  pagesToScrap = config.scrapNumberOfPages,
): Promise<{ entries: HighscoreEntry[]; logs: string[] }> {
  const allEntries: HighscoreEntry[] = [];
  const logs: string[] = [];
  const baseUrl = `${config.baseUrl}/${highscoresSection}/`;

  logs.push(
    `[${highscoresSection}] Scraping '${highscoresSection}' highscores (${pagesToScrap} pages)`,
  );

  // Fetch and parse each page
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

// Sections orchestrator
export async function mainHighscoresScraper() {
  const sections = config.sectionsToScrape;
  logger.section('Initializing scraping...');

  // Scrape sections concurrently
  const scrapePromises = sections.map(async (section) => {
    try {
      const { entries, logs } = await scrapeHighscore(section);
      return { section, entries, logs, error: null };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        section,
        entries: [],
        logs: [`[${section}] ERROR: Failed to scrape - ${errorMsg}`],
        error,
      };
    }
  });

  const results = await Promise.all(scrapePromises);

  // Print logs in order
  for (const { logs } of results) {
    for (const line of logs) {
      logger.info(line);
    }
  }

  // Abort if any section failed
  const failedSections = results.filter((r) => r.error);
  if (failedSections.length > 0) {
    logger.error(
      `\nCritical: Scraping failed for ${failedSections.length} section(s): ${failedSections.map((f) => f.section).join(', ')}`,
    );
    process.exit(1);
  }

  return results;
}
