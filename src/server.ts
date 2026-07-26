import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export type ServerId = 'classic' | 'seasonal';

const raw = (process.env.SERVER ?? 'classic').toLowerCase();
export const SERVER_ID: ServerId = raw === 'seasonal' ? 'seasonal' : 'classic';

const serverEnvPath = path.resolve(process.cwd(), 'env', SERVER_ID, '.env');
dotenv.config({ path: serverEnvPath });

const localOverridePath = path.resolve(process.cwd(), 'env', SERVER_ID, '.env.local');
if (fs.existsSync(localOverridePath)) {
  dotenv.config({ path: localOverridePath, override: true });
}
