import { config } from '../config';
import { logger } from '../utils/logger';
import { scrapeHighscore } from '.';

/**
 * Runs the scraping process for all configured sections.
 * Logs scraping output and errors.
 *
 * @returns {Promise<Array<{ section: string; entries: any[]; logs: string[]; error: any }>>}
 *   Resolves with an array of results for each section, including scraped entries, logs, and error info.
 *   If any section fails, the process exits with code 1.
 */
export async function mainScraper() {
  const sections = config.scraper.sectionsToScrape;
  logger.section('Initializing scraping...');

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

  for (const { logs } of results) {
    for (const line of logs) {
      logger.info(line);
    }
  }

  const failedSections = results.filter((r) => r.error);
  if (failedSections.length > 0) {
    logger.error(
      `\nCritical: Scraping failed for ${failedSections.length} section(s): ${failedSections.map((f) => f.section).join(', ')}`,
    );
    process.exit(1);
  }

  return results;
}
