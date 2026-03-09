import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  baseUrl: process.env.HIGHSCORES_SCRAPER_BASE_URL,
  scrapNumberOfPages: parseInt(process.env.HIGHSCORES_SCRAPER_PAGES_TO_SCRAP!),
  sectionsToScrape: [
    'experience',
    'magic',
    'shield',
    'distance',
    'club',
    'sword',
    'axe',
    'fist',
    'fishing',
  ] as const,
};
