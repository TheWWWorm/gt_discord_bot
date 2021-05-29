import log4js from 'log4js'
import config from '../config';
import { readDB, writeDB } from '../db/db_helper';
const logger = log4js.getLogger('Kamazone');

const MINUTE_IN_MS = 1e3 * 60;
const HOUR_IN_MS = MINUTE_IN_MS * 60;
const INTERVAL_IN_MS = HOUR_IN_MS * 24 * 3;

const ALERT_BEFORE_HOURS = 17;

const dbName = 'kamazoneRounds';
let roundsEmitted: Array<string> = readDB(dbName)

export function startKamazoneCron(cb: (res: number) => void) {
  const seasonStartDate = +(new Date(config.get('kamazoneStartDate') as string));
  setInterval((function cron() {
    const now = +(new Date())
    let roundEndDate = seasonStartDate;
    while (roundEndDate < now) {
      roundEndDate = roundEndDate + INTERVAL_IN_MS;
    }
    // Start of the day + 5:10 UTC
    roundEndDate = roundEndDate + (5 * HOUR_IN_MS + MINUTE_IN_MS * 10)
    if (roundsEmitted.includes(String(roundEndDate))) {
      return cron;
    }
    const diff = ((roundEndDate - now) % INTERVAL_IN_MS) / HOUR_IN_MS;
    logger.info(`Kamazone cron: End of the round is at ${new Date(roundEndDate).toString()}, right now it's ${new Date(roundEndDate - (ALERT_BEFORE_HOURS * HOUR_IN_MS)).toString()}, the time diff is ${diff} hours`);
    if (diff <= ALERT_BEFORE_HOURS) {
      roundsEmitted.push(String(roundEndDate));
      writeDB(dbName, roundsEmitted);
      cb(diff);
    } 
    return cron;
  })(), HOUR_IN_MS); 
}