import { describe, it, expect } from 'vitest';
import { resolveOutcome, applyDeltas } from './scoring';
import type { CurrentRound, Difficulty, Word } from '../store/types';

const MOCK_WORD: Word = {
  word: 'тест',
  category: 'предмети',
  hints: {
    low: ['hint1'],
    mid: ['hint2'],
    high: ['hint3'],
  },
};

const DIFFICULTY: Difficulty = 'low';

function makeCurrent(overrides: Partial<CurrentRound> = {}): CurrentRound {
  return {
    word: MOCK_WORD,
    hintUsed: 'hint1',
    difficulty: DIFFICULTY,
    imposterId: 'imposter',
    revealOrder: ['imposter', 'p1', 'p2'],
    revealIndex: 0,
    subRound: 1,
    speakingIndex: 0,
    vote: null,
    resolvedOutcome: null,
    kickedOutIds: [],
    startedAt: 0,
    ...overrides,
  };
}

const PLAYER_IDS = ['imposter', 'p1', 'p2', 'p3'];

describe('resolveOutcome', () => {
  describe('guessed', () => {
    it('gives imposter +5 and others 0', () => {
      const current = makeCurrent({ resolvedOutcome: 'guessed' });
      const { deltas, record } = resolveOutcome(current, PLAYER_IDS);

      expect(deltas.imposter).toBe(5);
      expect(deltas.p1).toBe(0);
      expect(deltas.p2).toBe(0);
      expect(deltas.p3).toBe(0);
      expect(record.caughtAtSubRound).toBeNull();
      expect(record.outcome).toBe('guessed');
    });
  });

  describe('survived', () => {
    it('gives imposter +7 and others 0', () => {
      const current = makeCurrent({ resolvedOutcome: 'survived' });
      const { deltas, record } = resolveOutcome(current, PLAYER_IDS);

      expect(deltas.imposter).toBe(7);
      expect(deltas.p1).toBe(0);
      expect(deltas.p2).toBe(0);
      expect(deltas.p3).toBe(0);
      expect(record.caughtAtSubRound).toBeNull();
      expect(record.outcome).toBe('survived');
    });
  });

  describe('caught', () => {
    it('at sub-round 1: imposter +0, each knower +3', () => {
      const current = makeCurrent({
        resolvedOutcome: 'caught',
        subRound: 1,
      });
      const { deltas, record } = resolveOutcome(current, PLAYER_IDS);

      expect(deltas.imposter).toBe(0);
      expect(deltas.p1).toBe(3);
      expect(deltas.p2).toBe(3);
      expect(deltas.p3).toBe(3);
      expect(record.caughtAtSubRound).toBe(1);
      expect(record.outcome).toBe('caught');
    });

    it('at sub-round 2: imposter +1, each knower +2', () => {
      const current = makeCurrent({
        resolvedOutcome: 'caught',
        subRound: 2,
      });
      const { deltas, record } = resolveOutcome(current, PLAYER_IDS);

      expect(deltas.imposter).toBe(1);
      expect(deltas.p1).toBe(2);
      expect(deltas.p2).toBe(2);
      expect(deltas.p3).toBe(2);
      expect(record.caughtAtSubRound).toBe(2);
    });

    it('at sub-round 3 and later: imposter +1, each knower +1', () => {
      const current = makeCurrent({
        resolvedOutcome: 'caught',
        subRound: 3,
      });
      const { deltas, record } = resolveOutcome(current, PLAYER_IDS);

      expect(deltas.imposter).toBe(1);
      expect(deltas.p1).toBe(1);
      expect(deltas.p2).toBe(1);
      expect(deltas.p3).toBe(1);
      expect(record.caughtAtSubRound).toBe(3);

      const later = resolveOutcome(
        makeCurrent({ resolvedOutcome: 'caught', subRound: 5 }),
        PLAYER_IDS,
      );
      expect(later.deltas.p1).toBe(1);
    });
  });

  describe('kicked-out players', () => {
    it('kicked-out players get 0 in caught outcome', () => {
      const current = makeCurrent({
        resolvedOutcome: 'caught',
        subRound: 2,
        kickedOutIds: ['p1'],
      });
      const { deltas, record } = resolveOutcome(current, PLAYER_IDS);

      expect(deltas.imposter).toBe(1);
      expect(deltas.p1).toBe(0); // kicked out → 0
      expect(deltas.p2).toBe(2); // active knower → +2
      expect(deltas.p3).toBe(2);
      expect(record.kickedOutIds).toEqual(['p1']);
    });

    it('imposter caught at later круг still excludes kicked players', () => {
      const current = makeCurrent({
        resolvedOutcome: 'caught',
        subRound: 5,
        kickedOutIds: ['p1', 'p2'],
      });
      const { deltas, record } = resolveOutcome(current, PLAYER_IDS);

      expect(deltas.imposter).toBe(2);
      expect(deltas.p1).toBe(0);
      expect(deltas.p2).toBe(0);
      expect(deltas.p3).toBe(1); // only remaining active knower
      expect(record.kickedOutIds).toEqual(['p1', 'p2']);
    });
  });
});

describe('applyDeltas', () => {
  it('sums existing scores with new deltas', () => {
    const scores = { imposter: 10, p1: 5, p2: 0 };
    const deltas = { imposter: -2, p1: 3, p2: 7 };
    const result = applyDeltas(scores, deltas);
    expect(result).toEqual({ imposter: 8, p1: 8, p2: 7 });
  });

  it('adds entries that exist only in deltas', () => {
    const scores = { p1: 10 };
    const deltas = { p2: 5 };
    const result = applyDeltas(scores, deltas);
    expect(result).toEqual({ p1: 10, p2: 5 });
  });

  it('does not mutate the original scores object', () => {
    const scores = { p1: 10 };
    const deltas = { p1: 5 };
    applyDeltas(scores, deltas);
    expect(scores).toEqual({ p1: 10 });
  });
});
