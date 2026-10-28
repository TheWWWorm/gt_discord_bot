import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseLatestCafeNews, toTranslatedUrl } from './cafe-parser.js';

test('parseLatestCafeNews finds the latest post', () => {
  const html = `
    <a href="/GuardianTales/ARyY/1234?" class="link_cafe">
      <span class="created_at">24.05.02</span>
    </a>`;
  assert.deepEqual(parseLatestCafeNews(html), {
    url: 'https://m.cafe.daum.net/GuardianTales/ARyY/1234?',
    date: new Date(2024, 4, 2).toDateString(),
  });
});

test('parseLatestCafeNews returns null for unknown pages', () => {
  assert.equal(parseLatestCafeNews('<html></html>'), null);
});

test('toTranslatedUrl', () => {
  assert.equal(
    toTranslatedUrl('https://m.cafe.daum.net/a?b'),
    'https://translate.google.com/translate?hl=en&sl=ko&tl=en&u=https%3A%2F%2Fm.cafe.daum.net%2Fa%3Fb',
  );
});
