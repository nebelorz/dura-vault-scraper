import { SERVER_ID, resolveEnv } from '../server';

const baseUrl = resolveEnv(process.env.CLASSIC_BASE_URL, process.env.SEASONAL_BASE_URL);
const normalizedBaseUrl = baseUrl?.replace(/\/+$/, '');

export const config = {
  url: normalizedBaseUrl ? `${normalizedBaseUrl}/?deaths` : undefined,
  serverTimezone:
    resolveEnv(process.env.CLASSIC_SERVER_TIMEZONE, process.env.SEASONAL_SERVER_TIMEZONE) ??
    'America/New_York',
  serverId: SERVER_ID,
};
