import { ENV } from '../env';

export const dbConfig = {
  host: ENV.pgHost,
  user: ENV.pgUser,
  password: ENV.pgPassword,
  database: ENV.pgDatabase,
  port: ENV.pgPort,
  ssl: ENV.dbSsl ? { rejectUnauthorized: false } : undefined,
};
