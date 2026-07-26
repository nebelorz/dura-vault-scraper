import type { HighscoreSection } from './types/section';
import { SERVER_ID } from '../server';
import { ENV } from '../env';

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
  baseUrl: ENV.baseUrl,
  scrapNumberOfPages: ENV.highscoresPages,
  sectionsToScrape: HIGHSCORE_SECTIONS,
  serverId: SERVER_ID,
};
