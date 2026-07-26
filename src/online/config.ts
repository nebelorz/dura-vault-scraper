import { SERVER_ID, resolveEnv } from '../server';

const baseUrl = resolveEnv(process.env.CLASSIC_BASE_URL, process.env.SEASONAL_BASE_URL);
const normalizedBaseUrl = baseUrl?.replace(/\/+$/, '');

export const config = {
  url: normalizedBaseUrl ? `${normalizedBaseUrl}/?online` : undefined,
  serverId: SERVER_ID,
};
