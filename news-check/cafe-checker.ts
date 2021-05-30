import axios from 'axios';
import log4js from 'log4js'
import { readDB, writeDB } from '../db/db_helper';

const logger = log4js.getLogger('Cafe checker');

const baseUrl = 'https://m.cafe.daum.net';
const gtCafeUlr = '/GuardianTales/ARyY';

const dbName = 'cafe-urls';
let cafeUrls: Array<string> = readDB(dbName);

export type CafeNewsType = {
  url: string;
  date: string;
}

export function checkCafeUrls(write = false, translated = true): Promise<CafeNewsType> {
  return axios.get(baseUrl + gtCafeUlr, {}).then((res) => {
    const body = res.data;
    if (body) {
      const url = baseUrl + /href=['"](\/GuardianTales\/.*?\/\d*?\??)['"]/m.exec(res.data)[1];
      const date = /<span class="created_at">(\d{2}\.\d{2}\.\d{2})<\/span>/m.exec(res.data)[1]
      const [year, month, day] = date.split('.'); 
      const returnObj = {
        url: translated ? 'https://translate.google.com/translate?hl=en&sl=ko&tl=en&u=' + encodeURIComponent(url): url,
        date: new Date(Number('20' + year), +month - 1, Number(day)).toDateString()
      };
      if (write) {
        if (!cafeUrls.includes(url)) {
          cafeUrls.push(url);
          writeDB('cafe-urls', cafeUrls);
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
  checkCafeUrls(true).then(cb);
  setInterval(() => {
    checkCafeUrls(true).then(cb);
  }, cronInterval)
}

