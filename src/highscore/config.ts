import type { HighscoreSection } from './types/section';
import { SERVER_ID, resolveEnv } from '../server';

export const HIGHSCORE_SECTIONS: readonly HighscoreSection[] = [
  'experience',
  'magic',
  'shield',
  'distance',
  'club',
  'sword',
  'axe',
  'fist',
  'fishing',
];

export const config = {
  baseUrl: resolveEnv(process.env.CLASSIC_BASE_URL, process.env.SEASONAL_BASE_URL)?.replace(/\/+$/, ''),
  scrapNumberOfPages: parseInt(
    resolveEnv(process.env.CLASSIC_HIGHSCORES_PAGES, process.env.SEASONAL_HIGHSCORES_PAGES) ?? '10',
  ),
  sectionsToScrape: HIGHSCORE_SECTIONS,
  serverId: SERVER_ID,
};
