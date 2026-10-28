import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getLogger } from './logger.js';
import { settings } from './settings.js';

const logger = getLogger('DB helper');

mkdirSync(settings.dbDir, { recursive: true });

const getDBPath = (name: string) => join(settings.dbDir, `${name}.json`);

export function readDB<T>(name: string): T[] {
  const path = getDBPath(name);
  if (!existsSync(path)) {
    writeDB(name, []);
    return [];
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    logger.error(`Errored while reading ${name}.json, starting with an empty one`, err);
    return [];
  }
}

export function writeDB(name: string, data: unknown): void {
  const path = getDBPath(name);
  try {
    // Write to a temp file first, so a crash mid-write can't leave a corrupted db behind
    writeFileSync(`${path}.tmp`, JSON.stringify(data));
    renameSync(`${path}.tmp`, path);
  } catch (err) {
    logger.error(`Errored while trying to update the ${name}.json file`, err);
  }
}
