import { resolveEnv } from '../server';

export const dbConfig = {
  host: resolveEnv(process.env.CLASSIC_PGHOST, process.env.SEASONAL_PGHOST),
  user: resolveEnv(process.env.CLASSIC_PGUSER, process.env.SEASONAL_PGUSER),
  password: resolveEnv(process.env.CLASSIC_PGPASSWORD, process.env.SEASONAL_PGPASSWORD),
  database: resolveEnv(process.env.CLASSIC_PGDATABASE, process.env.SEASONAL_PGDATABASE),
  port: Number.parseInt(
    resolveEnv(process.env.CLASSIC_PGPORT, process.env.SEASONAL_PGPORT) ?? '5432',
  ),
  ssl:
    resolveEnv(process.env.CLASSIC_DB_SSL, process.env.SEASONAL_DB_SSL) === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
};
