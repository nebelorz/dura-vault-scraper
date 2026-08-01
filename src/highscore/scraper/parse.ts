import * as cheerio from 'cheerio';
import { logger } from '../../utils/logger';
import { isValidVocation } from '../../validations';
import type { HighscoreEntry } from '../types';

interface ColumnIndices {
  rank: number;
  name: number;
  level: number;
  points: number | null;
}

// Table & column detection
function findHighscoreTable($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  let selectedTable = $('table').first();
  $('table').each((_, table) => {
    const firstRow = $(table).find('tr').first();
    const cells = firstRow.find('td');
    if (cells.length >= 3 && cells.length <= 5) {
      const texts = cells.map((_i: number, el: any) => $(el).text().trim().toLowerCase()).get();
      const hasRank = texts.includes('rank');
      const hasName = texts.includes('name');
      const hasLevel = texts.includes('level');
      if (hasRank && hasName && hasLevel) {
        selectedTable = $(table);
        return false;
      }
    }
  });
  return selectedTable;
}

function detectColumnIndices(
  table: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
): ColumnIndices | null {
  let columnIndices: ColumnIndices | null = null;
  table.find('tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 3) return;
    const texts = tds.map((_i: number, el: any) => $(el).text().trim().toLowerCase()).get();
    const rankIdx = texts.findIndex((t) => t === 'rank');
    const nameIdx = texts.findIndex((t) => t === 'name');
    const levelIdx = texts.findIndex((t) => t === 'level');
    const pointsIdx = texts.findIndex((t) => t === 'points');
    if (rankIdx !== -1 && nameIdx !== -1 && levelIdx !== -1) {
      columnIndices = {
        rank: rankIdx,
        name: nameIdx,
        level: levelIdx,
        points: pointsIdx !== -1 ? pointsIdx : null,
      };
      return false;
    }
  });
  return columnIndices;
}

// Row parser
export function isEmptyPage(html: string): boolean {
  return html.includes('No records yet.');
}

export function parseHighscore(html: string, section?: string): HighscoreEntry[] {
  const $ = cheerio.load(html);
  const entries: HighscoreEntry[] = [];

  const table = findHighscoreTable($);
  const columnIndices = detectColumnIndices(table, $);

  if (!columnIndices) {
    logger.error(`Failed to detect column indices for section '${section}' to parse`);
    return entries;
  }

  table.find('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 3) return;

    const rankText = cells.eq(columnIndices.rank).text().replace('.', '').trim();
    const rank = parseInt(rankText, 10);
    if (isNaN(rank) || rank <= 0) return;

    const nameCell = cells.eq(columnIndices.name);
    const name = nameCell.find('a span').first().text().trim();
    const vocation = nameCell.find('small').first().text().trim();
    if (!name) return;

    if (!isValidVocation(vocation)) {
      logger.warn(`[HIGHSCORE] Invalid vocation for player '${name}' in section '${section}': '${vocation}'`);
    }

    // The server renders Dura skills formula value but embeds the real value in [data-dura-value]
    const levelCell = cells.eq(columnIndices.level);
    const skillValueEl = levelCell.find('.skill-value[data-dura-value]');
    const levelText = skillValueEl.length
      ? skillValueEl.attr('data-dura-value')!
      : levelCell.text().replace(/\D/g, '');
    const level = parseInt(levelText, 10);
    if (isNaN(level) || level <= 0) return;

    // Points are only available for experience section
    let points: number | null = null;
    if (columnIndices.points !== null && cells.length > columnIndices.points) {
      const pointsText = cells.eq(columnIndices.points).text().replace(/[^\d]/g, '');
      const parsedPoints = parseInt(pointsText, 10);
      if (!isNaN(parsedPoints)) {
        points = parsedPoints;
      }
    }

    entries.push({ rank, name, vocation, level, points });
  });

  return entries;
}
