import assert from 'node:assert/strict';
import { test } from 'node:test';
import { atLeastOneChance, defenceReduction, objToEmbedFields, randomNumber, timeUntilReset } from './helpers.js';

test('objToEmbedFields maps keys to fields with N/A for empty values', () => {
  assert.deepEqual(objToEmbedFields({ a: '1', b: undefined, c: '' }), [
    { name: 'a', value: '1' },
    { name: 'b', value: 'N/A' },
    { name: 'c', value: 'N/A' },
  ]);
});

test('atLeastOneChance', () => {
  assert.equal(atLeastOneChance(100, 1), 100);
  assert.equal(atLeastOneChance(2.75, 100).toFixed(2), '93.85');
});

test('defenceReduction', () => {
  assert.equal(defenceReduction(100), 50);
});

test('randomNumber stays within bounds', () => {
  for (let i = 0; i < 1000; i++) {
    const n = randomNumber(1, 7);
    assert.ok(Number.isInteger(n) && n >= 1 && n <= 7);
  }
});

test('timeUntilReset counts minutes until 00:00 UTC', () => {
  assert.equal(timeUntilReset(new Date('2024-01-01T00:00:00Z')), 1440);
  assert.equal(timeUntilReset(new Date('2024-01-01T23:59:30Z')), 1);
  assert.equal(timeUntilReset(new Date('2024-01-01T12:30:00Z')), 690);
});
