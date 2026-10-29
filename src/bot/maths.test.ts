import assert from 'node:assert/strict';
import { test } from 'node:test';
import { genMaths } from './maths.js';

test('genMaths generates a formula that equals the target', () => {
  for (const target of [1, 42, -7, 1000]) {
    const formula = genMaths(target, 10);
    assert.match(formula, /^[\d+\-*/.e]+$/);
    assert.equal(Function(`return (${formula})`)(), target);
  }
});

test('genMaths gives up on targets it cannot hit', () => {
  assert.throws(() => genMaths(0.1, 50));
});
