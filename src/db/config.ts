import * as dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: Number.parseInt(process.env.PGPORT!),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};
