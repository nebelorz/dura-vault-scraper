import * as cheerio from 'cheerio';
import type { OnlineEntry } from '../types';

// Row parser
export function parseOnline(html: string): OnlineEntry[] {
  const $ = cheerio.load(html);
  const entries: OnlineEntry[] = [];

  $('tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 3) return;

    // Skip header row
    const firstCellText = tds.eq(0).text().trim().toLowerCase();
    if (firstCellText === 'name') return;

    const name = tds.eq(0).find('a').text().trim();
    const level = parseInt(tds.eq(1).text().trim(), 10);
    const vocation = tds.eq(2).text().trim();

    if (!name || isNaN(level) || level <= 0) return;

    entries.push({ name, level, vocation });
  });

  return entries;
}
