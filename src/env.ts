function envRequired(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function envInt(name: string, defaultValue?: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer, got: ${raw}`);
  }
  return parsed;
}

function envBool(name: string): boolean {
  return process.env[name] === 'true';
}

const rawBaseUrl = envRequired('BASE_URL');

export const ENV = {
  baseUrl: rawBaseUrl.replace(/\/+$/, ''),
  pgHost: envRequired('PGHOST'),
  pgUser: envRequired('PGUSER'),
  pgPassword: envRequired('PGPASSWORD'),
  pgDatabase: envRequired('PGDATABASE'),
  pgPort: envInt('PGPORT', 5432),
  dbSsl: envBool('DB_SSL'),
  highscoresPages: envInt('HIGHSCORES_PAGES', 10),
  highscoresTopRecords: envInt('HIGHSCORES_TOP_RECORDS', 100),
  onlineTopRecords: envInt('ONLINE_TOP_RECORDS', 100),
  serverTimezone: envRequired('SERVER_TIMEZONE'),
} as const;

if (ENV.highscoresTopRecords < 1) {
  throw new Error(`HIGHSCORES_TOP_RECORDS must be >= 1, got: ${ENV.highscoresTopRecords}`);
}
if (ENV.onlineTopRecords < 1) {
  throw new Error(`ONLINE_TOP_RECORDS must be >= 1, got: ${ENV.onlineTopRecords}`);
}

export { envInt, envBool };
