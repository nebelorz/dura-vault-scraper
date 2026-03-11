import { config } from '../config';
import { fetchHTML } from '../../utils/fetch-html';
import { parseOnline } from './parse';
import { logger } from '../../utils/logger';
import type { OnlineEntry } from '../types';

// Scraper
async function scrapeOnline(): Promise<OnlineEntry[]> {
  const url = config.url!;
  const html = await fetchHTML(url);
  const entries = parseOnline(html);

  logger.info(`[ONLINE] Scraped ${entries.length} players`);
  return entries;
}

// Entry point for 15-min scrape
export async function mainOnlineScraper(): Promise<OnlineEntry[]> {
  logger.section('Online scraper started');
  const entries = await scrapeOnline();
  return entries;
}
