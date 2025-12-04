import * as cheerio from 'cheerio';
import type { HighscoreEntry } from '../types';

/**
 * Finds the highscore table in the HTML based on header column names.
 */
function findHighscoreTable($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  return $('table')
    .filter((_, el) => {
      const header = $(el).find('tr').first().text();
      return header.includes('Rank') && header.includes('Name') && header.includes('Level');
    })
    .first();
}

/**
 * Checks if the table has a Points/Experience column.
 */
function hasPointsColumn(table: cheerio.Cheerio<any>): boolean {
  const headerCells = table.find('tr').first().find('td');
  return headerCells.length > 3 && /Points/i.test(headerCells.eq(3).text());
}

/**
 * Parses the rank from a table cell. Returns null if not a valid rank.
 */
function parseRank(cell: cheerio.Cheerio<any>): number | null {
  const rankText = cell.text().replace('.', '').trim();
  const rank = parseInt(rankText, 10);
  return isNaN(rank) ? null : rank;
}

/**
 * Parses the character name and vocation from a table cell.
 */
function parseNameAndVocation(cell: cheerio.Cheerio<any>): { name: string; vocation: string } {
  const name = cell.find('a span').first().text().trim();
  const vocation = cell.find('small').first().text().trim();
  return { name, vocation };
}

/**
 * Parses the level from a table cell.
 */
function parseLevel(cell: cheerio.Cheerio<any>): number {
  return parseInt(cell.text().replace(/\D/g, ''), 10);
}

/**
 * Parses the points/experience from a table cell if available.
 */
function parsePoints(cell: cheerio.Cheerio<any>): number | undefined {
  const points = parseInt(cell.text().replace(/[^\d]/g, ''), 10);
  return isNaN(points) ? undefined : points;
}

/**
 * Parses the highscore HTML and extracts an array of HighscoreEntry objects.
 * Supports tables with or without a Points/Experience column.
 */
export function parseHighscore(html: string): HighscoreEntry[] {
  const $ = cheerio.load(html);
  const entries: HighscoreEntry[] = [];

  const table = findHighscoreTable($);
  const hasPoints = hasPointsColumn(table);

  table.find('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 3) return; // Skip header or incomplete rows

    const rank = parseRank(cells.eq(0));
    if (rank === null) return; // Skip non-data rows

    const { name, vocation } = parseNameAndVocation(cells.eq(1));
    const level = parseLevel(cells.eq(2));

    const entry: HighscoreEntry = { rank, name, vocation, level };

    if (hasPoints && cells.length > 3) {
      const experience = parsePoints(cells.eq(3));
      if (experience !== undefined) {
        entry.experience = experience;
      }
    }

    entries.push(entry);
  });

  return entries;
}
