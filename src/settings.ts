import { join } from 'node:path';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Check your .env file (see template.env)`);
  }
  return value;
}

// General bot settings, read from the environment (.env file)
export const settings = {
  isProd: process.env.PROD === 'true',
  botPrefixes: required('BOT_PREFIXES')
    .split(',')
    .map((prefix) => prefix.trim().toLowerCase())
    .filter(Boolean),
  discordToken: required('DISCORD_TOKEN'),
  dbDir: process.env.DB_DIR?.trim() || join(process.cwd(), 'db', 'bases'),
};
