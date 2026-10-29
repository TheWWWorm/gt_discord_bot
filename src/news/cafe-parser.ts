export const cafeBaseUrl = 'https://m.cafe.daum.net';
export const gtCafePath = '/GuardianTales/ARyY';

export type CafeNews = {
  url: string;
  date: string;
};

// Pulls the latest post out of the cafe page html
export function parseLatestCafeNews(html: string): CafeNews | null {
  const path = /href=['"](\/GuardianTales\/.*?\/\d*?\??)['"]/m.exec(html)?.[1];
  const date = /<span class="created_at">(\d{2}\.\d{2}\.\d{2})<\/span>/m.exec(html)?.[1];
  if (!path || !date) {
    return null;
  }
  const [year, month, day] = date.split('.').map(Number);
  return {
    url: cafeBaseUrl + path,
    date: new Date(2000 + year, month - 1, day).toDateString(),
  };
}

export const toTranslatedUrl = (url: string) =>
  'https://translate.google.com/translate?hl=en&sl=ko&tl=en&u=' + encodeURIComponent(url);
