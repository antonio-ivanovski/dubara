import { describe, expect, it } from 'vitest';
import { WORDS } from './words';
import { HINT_GLOSSARY } from './hintGlossary';

describe('hint glossary', () => {
  it('covers a substantial set of hint words', () => {
    expect(Object.keys(HINT_GLOSSARY).length).toBeGreaterThanOrEqual(500);
  });

  it('only contains words that actually appear as hints', () => {
    const allHints = new Set<string>();
    for (const entry of WORDS) {
      for (const hint of [...entry.hints.low, ...entry.hints.mid, ...entry.hints.high]) {
        allHints.add(hint);
      }
    }
    for (const key of Object.keys(HINT_GLOSSARY)) {
      expect(allHints.has(key)).toBe(true);
    }
  });

  it('provides a clean definition and example for every entry', () => {
    for (const [key, value] of Object.entries(HINT_GLOSSARY)) {
      const k = key.toLowerCase();

      expect(value.definition.trim().length).toBeGreaterThan(0);
      expect(value.definition).toBe(value.definition.trim());
      expect(value.definition).not.toMatch(/[A-Za-z]/);
      expect(value.definition.endsWith('.')).toBe(true);
      expect(value.definition.toLowerCase().includes(k)).toBe(false);

      expect(value.example.trim().length).toBeGreaterThan(0);
      expect(value.example).toBe(value.example.trim());
      expect(value.example).not.toMatch(/[A-Za-z]/);
      expect(['.', '!', '?']).toContain(value.example.slice(-1));
      expect(value.example.toLowerCase().includes(k)).toBe(true);
    }
  });
});
