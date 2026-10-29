declare module 'animal-ids' {
  export const animals: string[];
  export const adjectives: string[];
  export function generateID(length?: number, separator?: string, mutator?: (id: string) => string): string;
}
