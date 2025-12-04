import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  scraper: {
    baseUrl: process.env.SCRAPER_BASE_URL,
    defaultPagesNumber: 1,
  },
  database: {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: parseInt(process.env.PGPORT!),
  },
  fetchHTML: {
    maxRetries: 3,
    retryDelayMs: 5000, // 5 secs
    timeoutMs: 10000, // 10 secs
  },
};
