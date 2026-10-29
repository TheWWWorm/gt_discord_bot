import { readDB, writeDB } from '../db.js';
import { getLogger } from '../logger.js';
import { cafeBaseUrl, gtCafePath, parseLatestCafeNews, toTranslatedUrl, type CafeNews } from './cafe-parser.js';

const logger = getLogger('Cafe checker');

const pageUrl = cafeBaseUrl + gtCafePath;
const cronInterval = 60 * 1000;
const fetchTimeout = 30 * 1000;

const dbName = 'cafe-urls';
const seenUrls = readDB<string>(dbName);

type CheckOptions = {
  // Only return news that weren't returned before, and remember them
  onlyNew?: boolean;
  translated?: boolean;
};

export async function checkCafeNews({ onlyNew = false, translated = false }: CheckOptions = {}): Promise<CafeNews | null> {
  try {
    const res = await fetch(pageUrl, { signal: AbortSignal.timeout(fetchTimeout) });
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const news = parseLatestCafeNews(await res.text());
    if (!news) {
      logger.warn(`Couldn't find the latest news on ${pageUrl}`);
      return null;
    }
    if (onlyNew) {
      if (seenUrls.includes(news.url)) {
        return null;
      }
      seenUrls.push(news.url);
      writeDB(dbName, seenUrls);
    }
    return translated ? { ...news, url: toTranslatedUrl(news.url) } : news;
  } catch (err) {
    logger.error(`Errored during the fetch of ${pageUrl}`, err);
    return null;
  }
}

export function startCafeNewsCron(cb: (news: CafeNews) => unknown): void {
  const check = async () => {
    const news = await checkCafeNews({ onlyNew: true });
    if (!news) {
      return;
    }
    try {
      await cb(news);
    } catch (err) {
      logger.error('Errored while posting the news', err);
    }
  };
  void check();
  setInterval(check, cronInterval);
}
