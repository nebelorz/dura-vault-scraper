import { fetchHTML } from '../../utils/fetch-html';
import { logger } from '../../utils/logger';
import { config } from '../config';
import { parseDeaths } from './parse';
import type { DeathEntry } from '../types';

async function scrapeDeaths(): Promise<DeathEntry[]> {
  if (!config.url) throw new Error('[DEATHS] BASE_URL is not defined');

  const html = await fetchHTML(config.url);
  const entries = parseDeaths(html);
  logger.info(`[DEATHS] Parsed ${entries.length} death entries`);
  return entries;
}

export async function mainDeathsScraper(): Promise<DeathEntry[]> {
  logger.section('Starting Deaths Scraper...');
  return await scrapeDeaths();
}
