import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  scraper: {
    baseUrl: process.env.SCRAPER_BASE_URL,
    scrapNumberOfPages: parseInt(process.env.SCRAPER_PAGES_TO_SCRAP!),
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
  },
  database: {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: parseInt(process.env.PGPORT!),
    ssl: { rejectUnauthorized: false },
  },
  fetchHTML: {
    maxRetries: 3,
    retryDelayMs: 5000, // 5 secs
    timeoutMs: 10000, // 10 secs
  },
};
