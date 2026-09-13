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
      // All 9 hints within one entry must be distinct across tiers.
      const all = [...entry.hints.low, ...entry.hints.mid, ...entry.hints.high];
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it('never uses another dictionary word as a hint', () => {
    const targets = new Set(WORDS.map((entry) => entry.word));
    for (const entry of WORDS) {
      for (const hint of [...entry.hints.low, ...entry.hints.mid, ...entry.hints.high]) {
        expect(targets.has(hint)).toBe(false);
      }
    }
  });

  it('keeps high-tier (revealing) hints globally unique', () => {
    const seen = new Map<string, string>();
    for (const entry of WORDS) {
      for (const hint of entry.hints.high) {
        expect(seen.has(hint)).toBe(false);
        seen.set(hint, entry.word);
      }
    }
  });

  it('uses clean literary form: lowercase, no latin, max two words', () => {
    for (const entry of WORDS) {
      expect(entry.word).toBe(entry.word.toLowerCase());
      for (const hint of [...entry.hints.low, ...entry.hints.mid, ...entry.hints.high]) {
        expect(hint).toBe(hint.toLowerCase());
        expect(hint).toBe(hint.trim());
        expect(hint).not.toMatch(/[A-Za-z]/);
        expect(hint.split(/\s+/).length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('provides a definition and an example sentence for every word', () => {
    for (const entry of WORDS) {
      const word = entry.word.toLowerCase();

      expect(entry.definition.trim().length).toBeGreaterThan(0);
      expect(entry.definition).toBe(entry.definition.trim());
      expect(entry.definition).not.toMatch(/[A-Za-z]/);
      expect(entry.definition.endsWith('.')).toBe(true);
      // The definition must paraphrase, not contain the word itself.
      expect(entry.definition.toLowerCase().includes(word)).toBe(false);

      expect(entry.example.trim().length).toBeGreaterThan(0);
      expect(entry.example).toBe(entry.example.trim());
      expect(entry.example).not.toMatch(/[A-Za-z]/);
      expect(['.', '!', '?']).toContain(entry.example.slice(-1));
      // The example must actually use the word.
      expect(entry.example.toLowerCase().includes(word)).toBe(true);
    }
  });
});
