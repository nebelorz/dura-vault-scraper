import * as dotenv from 'dotenv';
import type { HighscoreSection } from './types/section';

dotenv.config();

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
  baseUrl: process.env.HIGHSCORES_SCRAPER_BASE_URL,
  scrapNumberOfPages: parseInt(process.env.HIGHSCORES_SCRAPER_PAGES_TO_SCRAP!),
  sectionsToScrape: HIGHSCORE_SECTIONS,
};
