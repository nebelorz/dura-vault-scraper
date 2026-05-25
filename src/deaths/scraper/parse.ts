import * as cheerio from 'cheerio';
import type { DeathEntry } from '../types';

function parseTimestamp(raw: string): string | null {
  // raw = "25.05.2026, 12:41:53" → "2026-05-25 12:41:53"
  const parts = raw.split(', ');
  if (parts.length !== 2) return null;

  const datePart = parts[0];
  const timePart = parts[1];
  if (!datePart || !timePart) return null;
  const dateParts = datePart.split('.');
  if (dateParts.length !== 3) return null;

  const [day, month, year] = dateParts;
  if (!day || !month || !year) return null;

  return `${year}-${month}-${day} ${timePart}`;
}

export function parseDeaths(html: string): DeathEntry[] {
  const $ = cheerio.load(html);
  const entries: DeathEntry[] = [];

  $('#deaths .Table3 tr').each((_, row) => {
    const tds = $(row).find('> td');
    if (tds.length < 3) return;

    // td[1]: timestamp
    const timestampRaw = tds.eq(1).find('small').text().trim();
    const diedAt = parseTimestamp(timestampRaw);
    if (!diedAt) return;

    // td[2]: death info
    const deathTd = tds.eq(2);
    const links = deathTd.find('a');
    const playerName = links.eq(0).text().trim();
    const playerLevel = Number.parseInt(deathTd.find('strong').text().trim(), 10);

    if (!playerName || Number.isNaN(playerLevel) || playerLevel <= 0) return;

    // PvP: second <a> is the PK (killer) | PvE: killer is plain text
    const isPvp = links.length >= 2;
    let killerName: string;

    if (isPvp) {
      killerName = links.eq(1).text().trim();
    } else {
      const fullText = deathTd.text().replace(/\s+/g, ' ').trim();
      const match = / by ([^.]+)\./.exec(fullText);
      if (!match?.[1]) return;
      killerName = match[1].trim();
    }

    if (!killerName) return;

    entries.push({ playerName, killerName, playerLevel, diedAt, isPvp });
  });

  return entries;
}
