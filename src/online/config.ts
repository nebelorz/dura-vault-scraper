import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  url: process.env.ONLINE_SCRAPER_URL,
};
