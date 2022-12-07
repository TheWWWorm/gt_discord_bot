import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFile } from 'fs';
import { getLogger } from 'log4js';

const logger = getLogger('DB helper');

// Path for the file that would contain the available cafe url
const basesDir = join(__dirname + '/bases');

if (!existsSync(basesDir)){
  mkdirSync(basesDir);
}

function getDBName(name: string) {
  return join(basesDir + '/' + name + '.json');
}

export function readDB(name: string) {
  let data;
  try {
    // Read the room file from the disk
    data = JSON.parse(readFileSync(getDBName(name)).toString());
  } catch (e) {
    // If room file does not exist, create it
    writeDB(name, []);
    data = [];
  }
  return data;
}

export function writeDB(name: string, data: any) {
  writeFile(getDBName(name), JSON.stringify(data), (err) => {
    if (err) {
      logger.error(`Errored while trying to update ${name}.json the file`, err.stack);
    }
  });
}