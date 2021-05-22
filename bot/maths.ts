function getRandomInt(max = 100): string {
  return String(Math.floor(Math.random() * max));
}

const signs = ['+', '-', '/', '*'];
function sign(): string {
  return signs[Math.floor(Math.random() * signs.length)];
}

// I don't deny - it's a pretty wacky way to generate formulas =)
function genSeq(target: number, depth: number, curr = getRandomInt()) {
  if (depth > 0) {
    curr += sign() + getRandomInt();
    return genSeq(target, depth - 1, curr);
  }
  const currentValue = eval(curr);
  if (currentValue != target) {
    if (target > currentValue) {
      return `${curr}+${target-currentValue}`;
    }
    return `${curr}-${currentValue-target}`;
  }

  return curr;
}

export function genMaths(expected: number, difficulty: number) {
  let seq = null;
  let value = null;
  do {
    seq = genSeq(expected, difficulty);
    value = eval(seq);
  } while (expected !== value);
  return seq;
}
