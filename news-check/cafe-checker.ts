import axios from 'axios';
import path from 'path';
import fs from 'fs';
import log4js from 'log4js'

const logger = log4js.getLogger('Cafe checker');

const baseUrl = 'https://m.cafe.daum.net';
const gtCafeUlr = '/GuardianTales/ARyY';

// Path for the file that would contain the available cafe url
const cafeUrlFileName = path.join(__dirname + '/cafe-urls.json');

// Update the room file on the disk
function syncCafeUrls(obj) {
  fs.writeFile(cafeUrlFileName, JSON.stringify(obj), (err) => {
    if (err) {
      logger.error('Errored while trying to update the cafe-urls file', err.stack);
    }
  });
}

let cafeUrls: Array<string>;
try {
  // Read the room file from the disk
  cafeUrls = JSON.parse(fs.readFileSync(cafeUrlFileName).toString());
} catch (e) {
  // If room file does not exist, create it
  cafeUrls = [];
  syncCafeUrls(cafeUrls);
}

export type CafeNewsType = {
  url: string;
  date: string;
}

export function checkCafeUrls(write = false): Promise<CafeNewsType> {
  return axios.get(baseUrl + gtCafeUlr, {}).then((res) => {
    const body = res.data;
    if (body) {
      const url = baseUrl + /href=['"](\/GuardianTales\/.*?\/\d*?\??)['"]/m.exec(res.data)[1];
      const date = /<span class="created_at">(\d{2}\.\d{2}\.\d{2})<\/span>/m.exec(res.data)[1]
      const [year, month, day] = date.split('.'); 
      const returnObj = {
        url,
        date: new Date(Number('20' + year), +month - 1, Number(day)).toDateString()
      };
      if (write) {
        if (!cafeUrls.includes(url)) {
          cafeUrls.push(url);
          syncCafeUrls(cafeUrls);
          return returnObj;
        }
        return null
      }
      return returnObj
    }
    return null;
  }).catch((err) => {
    logger.error(`Errored during the fetch of ${baseUrl + gtCafeUlr}`, err.stack)
    return null;
  });
}

const cronInterval = 1e3 * 60;

export function startCafeNewsCron(cb: (res: CafeNewsType) => void) {
  setInterval(() => {
    checkCafeUrls(true).then(cb);
  }, cronInterval)
}

