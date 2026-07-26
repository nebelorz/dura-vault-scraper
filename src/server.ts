import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load base .env (silently no-ops if missing, e.g. in CI)
dotenv.config();

export type ServerId = 'classic' | 'seasonal';

const raw = (process.env.SERVER ?? 'classic').toLowerCase();
export const SERVER_ID: ServerId = raw === 'seasonal' ? 'seasonal' : 'classic';

// Load server-specific local override file if it exists.
// Uses override: true so local values win over .env defaults.
const localOverridePath = path.resolve(process.cwd(), `.env.${SERVER_ID}.local`);
if (fs.existsSync(localOverridePath)) {
  dotenv.config({ path: localOverridePath, override: true });
}

/**
 * Resolves an environment variable for the active server.
 * Both classic and seasonal use symmetric prefixed vars — neither is the "default".
 */
export function resolveEnv(
  classicVal: string | undefined,
  seasonalVal: string | undefined,
): string | undefined {
  return SERVER_ID === 'seasonal' ? seasonalVal : classicVal;
}
