import type { APIEmbedField } from 'discord.js';

export function objToEmbedFields(obj: object): APIEmbedField[] {
  return Object.entries(obj).map(([name, value]) => ({
    name,
    value: value ? String(value) : 'N/A',
  }));
}

// Chance (in %) to get at least 1 success in `rolls` attempts, each with `chance`% to succeed
export function atLeastOneChance(chance: number, rolls: number): number {
  return (1 - ((100 - chance) / 100) ** rolls) * 100;
}

// Damage reduction (in %) for the given amount of defence
export function defenceReduction(amount: number): number {
  return (1 - 1 / (amount / 100 + 1)) * 100;
}

export function randomNumber(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Minutes left until the daily reset (00:00 UTC)
export function timeUntilReset(now = new Date()): number {
  const minutesInDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  return 24 * 60 - minutesInDay;
}
