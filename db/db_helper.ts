import path from 'path';
import fs from 'fs';
import log4js from 'log4js'

const logger = log4js.getLogger('DB helper');

// Path for the file that would contain the available cafe url
const basesDir = path.join(__dirname + '/bases');

if (!fs.existsSync(basesDir)){
  fs.mkdirSync(basesDir);
}

function getDBName(name: string) {
  return path.join(basesDir + '/' + name + '.json');
}

export function readDB(name: string) {
  let data;
  try {
    // Read the room file from the disk
    data = JSON.parse(fs.readFileSync(getDBName(name)).toString());
  } catch (e) {
    // If room file does not exist, create it
    writeDB(name, []);
    data = [];
  }
  return data;
}

export function writeDB(name: string, data: any) {
  fs.writeFile(getDBName(name), JSON.stringify(data), (err) => {
    if (err) {
      logger.error(`Errored while trying to update ${name}.json the file`, err.stack);
    }
  });
}