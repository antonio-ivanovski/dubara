import { describe, it, expect } from 'vitest';
import { computeSubRoundCap } from './subRoundCap';
import { makePlayers } from '../test-utils/resetStore';

describe('computeSubRoundCap', () => {
  it('returns 2 for zero players', () => {
    expect(computeSubRoundCap([])).toBe(2);
  });

  it('returns 2 for one player', () => {
    expect(computeSubRoundCap(makePlayers(1))).toBe(2);
  });

  it('returns 2 for two players', () => {
    expect(computeSubRoundCap(makePlayers(2))).toBe(2);
  });

  it('returns 2 for three players', () => {
    expect(computeSubRoundCap(makePlayers(3))).toBe(2);
  });

  it('returns 2 for four players', () => {
    expect(computeSubRoundCap(makePlayers(4))).toBe(2);
  });

  it('returns 3 for five players', () => {
    expect(computeSubRoundCap(makePlayers(5))).toBe(3);
  });

  it('returns 3 for six players', () => {
    expect(computeSubRoundCap(makePlayers(6))).toBe(3);
  });

  it('returns 4 for seven players', () => {
    expect(computeSubRoundCap(makePlayers(7))).toBe(4);
  });

  it('returns 4 for eight players', () => {
    expect(computeSubRoundCap(makePlayers(8))).toBe(4);
  });

  it('returns 5 for nine players', () => {
    expect(computeSubRoundCap(makePlayers(9))).toBe(5);
  });

  it('returns 5 for ten players', () => {
    expect(computeSubRoundCap(makePlayers(10))).toBe(5);
  });
});
