import { SERVER_ID } from '../server';
import { ENV } from '../env';

export const config = {
  url: `${ENV.baseUrl}/?online`,
  serverId: SERVER_ID,
};
