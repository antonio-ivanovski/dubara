import { describe, it, expect } from 'vitest';
import { shuffle, pickRandom } from './shuffle';

describe('shuffle', () => {
  it('returns a permutation of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it('contains all input elements', () => {
    const input = [10, 20, 30, 40];
    const result = shuffle(input);
    expect(result.sort()).toEqual([10, 20, 30, 40]);
  });

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c'];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it('returns an empty array for empty input', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it('produces different permutations over many runs (probabilistic)', () => {
    // Run shuffle many times and expect at least 2 distinct outputs
    const input = [1, 2, 3, 4];
    const outputs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      outputs.add(shuffle(input).join(','));
    }
    // With 4 elements there are 24 permutations; we should see >1 in 100 runs
    expect(outputs.size).toBeGreaterThan(1);
  });
});

describe('pickRandom', () => {
  it('returns an element that exists in the input', () => {
    const input = [7, 8, 9];
    const result = pickRandom(input);
    expect(input).toContain(result);
  });

  it('returns an element when input has one element', () => {
    expect(pickRandom([42])).toBe(42);
  });

  it('throws on empty input', () => {
    expect(() => pickRandom([])).toThrow('pickRandom: empty input');
  });
});
