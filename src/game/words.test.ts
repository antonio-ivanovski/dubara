import { describe, expect, it } from 'vitest';
import { WORDS } from './words';

describe('dictionary', () => {
  it('contains a substantial set of unique, categorized words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(150);
    expect(new Set(WORDS.map((entry) => entry.word)).size).toBe(WORDS.length);
    expect(WORDS.every((entry) => entry.category.length > 0)).toBe(true);
  });

  it('provides useful, non-empty hint pools without revealing the answer literally', () => {
    for (const entry of WORDS) {
      for (const hints of Object.values(entry.hints)) {
        expect(hints.length).toBeGreaterThanOrEqual(3);
        expect(new Set(hints).size).toBe(hints.length);
        expect(hints.every((hint) => hint.trim().length > 0)).toBe(true);
        expect(hints).not.toContain(entry.word);
      }
    }
  });
});
