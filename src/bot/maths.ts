const signs = ['+', '-', '/', '*'];
// Give up eventually, instead of blocking the bot forever on targets that can't be hit (e.g. 0.1)
const maxAttempts = 1000;

const getRandomInt = (max = 100) => String(Math.floor(Math.random() * max));
const sign = () => signs[Math.floor(Math.random() * signs.length)];

// Formulas are built only from numbers and the signs above, so evaluating them is safe
const evaluate = (formula: string): number => Function(`"use strict"; return (${formula});`)();

// I don't deny - it's a pretty wacky way to generate formulas =)
function genSeq(target: number, depth: number): string {
  let seq = getRandomInt();
  for (let i = 0; i < depth; i++) {
    seq += sign() + getRandomInt();
  }
  const value = evaluate(seq);
  if (value === target) {
    return seq;
  }
  return target > value ? `${seq}+${target - value}` : `${seq}-${value - target}`;
}

export function genMaths(expected: number, difficulty: number): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seq = genSeq(expected, difficulty);
    if (evaluate(seq) === expected) {
      return seq;
    }
  }
  throw new Error(`Couldn't generate a formula for ${expected}`);
}
