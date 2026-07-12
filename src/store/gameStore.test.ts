import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { resetStore, seedPlayers } from '../test-utils/resetStore';
import { computeSubRoundCap } from '../game/subRoundCap';

beforeEach(() => {
  resetStore();
});

function driveToRound(names: string[]): { ids: string[]; imposterId: string } {
  const ids = seedPlayers(names);
  const store = useGameStore.getState();
  store.startTournament();
  store.setDifficulty('low');

  // Advance reveal through all players to reach 'round'
  const current = useGameStore.getState().current!;
  const revealCount = current.revealOrder.length;
  for (let i = 0; i < revealCount; i++) {
    useGameStore.getState().advanceReveal();
  }

  expect(useGameStore.getState().phase).toBe('round');
  return { ids, imposterId: useGameStore.getState().current!.imposterId };
}

describe('addPlayer / removePlayer', () => {
  it('addPlayer adds a player', () => {
    const ids = seedPlayers(['Ana', 'Marko', 'Elena']);
    const state = useGameStore.getState();
    expect(state.players.map((p) => p.id)).toEqual(ids);
    expect(state.players.map((p) => p.name)).toEqual(['Ana', 'Marko', 'Elena']);
  });

  it('removePlayer removes the player and cleans up scores', () => {
    const ids = seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();

    // Manually set some scores for the removed player
    useGameStore.setState((s) => ({
      scores: { ...s.scores, [ids[1] as string]: 10 },
    }));

    store.removePlayer(ids[1] as string);
    const state = useGameStore.getState();
    expect(state.players.map((p) => p.id)).toEqual([ids[0], ids[2]]);
    expect(state.players.map((p) => p.name)).toEqual(['Ana', 'Elena']);
    // Scores for removed player should be gone
    expect(state.scores[ids[1] as string]).toBeUndefined();
  });

  it('addPlayer trims whitespace', () => {
    seedPlayers(['  Ana  ']);
    const state = useGameStore.getState();
    expect(state.players[0]!.name).toBe('Ana');
  });

  it('addPlayer ignores empty name', () => {
    seedPlayers(['']);
    const state = useGameStore.getState();
    expect(state.players).toHaveLength(0);
  });
});

describe('startTournament', () => {
  it('does nothing with fewer than 3 players', () => {
    seedPlayers(['Ana', 'Marko']);
    useGameStore.getState().startTournament();
    expect(useGameStore.getState().phase).toBe('lobby');
  });

  it('transitions to difficultyPick with ≥3 players', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().startTournament();
    expect(useGameStore.getState().phase).toBe('difficultyPick');
  });

  it('resets scores when starting a tournament', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();
    // All scores should be 0
    const scores = useGameStore.getState().scores;
    expect(Object.values(scores).every((v) => v === 0)).toBe(true);
  });
});

describe('setDifficulty', () => {
  it('creates a current round with the chosen difficulty and transitions to reveal', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();
    store.setDifficulty('low');
    const state = useGameStore.getState();
    expect(state.current).not.toBeNull();
    expect(state.current!.difficulty).toBe('low');
    expect(state.phase).toBe('reveal');
  });

  it('picks an imposter that is one of the players', () => {
    const ids = seedPlayers(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().startTournament();
    useGameStore.getState().setDifficulty('high');
    const imposterId = useGameStore.getState().current!.imposterId;
    expect(ids).toContain(imposterId);
  });
});

describe('advanceReveal', () => {
  it('walks through the reveal order and transitions to round', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();
    store.setDifficulty('low');

    const state = useGameStore.getState();
    expect(state.phase).toBe('reveal');
    expect(state.current!.revealIndex).toBe(0);

    // Advance through all reveal positions
    const revealCount = state.current!.revealOrder.length;
    for (let i = 0; i < revealCount; i++) {
      useGameStore.getState().advanceReveal();
    }

    const final = useGameStore.getState();
    expect(final.phase).toBe('round');
    // After transition to round, revealIndex is reset to 0 (no longer meaningful).
    expect(final.current!.revealIndex).toBe(0);
  });

  it('sets speakingIndex to a random first speaker when transitioning to round', () => {
    let sawNonZero = false;
    const iterations = 30;

    for (let i = 0; i < iterations; i++) {
      const ids = seedPlayers(['Ana', 'Marko', 'Elena']);
      const store = useGameStore.getState();
      store.startTournament();
      store.setDifficulty('low');

      const current = useGameStore.getState().current!;
      const revealCount = current.revealOrder.length;

      // Advance through all reveal positions → transition to round
      for (let j = 0; j < revealCount; j++) {
        useGameStore.getState().advanceReveal();
      }

      const state = useGameStore.getState();
      expect(state.phase).toBe('round');

      const { speakingIndex, revealOrder } = state.current!;
      // speakingIndex must be a valid index into revealOrder
      expect(speakingIndex).toBeGreaterThanOrEqual(0);
      expect(speakingIndex).toBeLessThan(revealOrder.length);
      // The referenced player must be one of the registered player IDs
      expect(ids).toContain(revealOrder[speakingIndex]);

      if (speakingIndex > 0) sawNonZero = true;
    }

    // At least one iteration should have picked a non-first speaker,
    // proving the random selection isn't degenerate.
    expect(sawNonZero).toBe(true);
  });
});

describe('openVote', () => {
  it('creates vote state and transitions to vote phase', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().openVote();
    const state = useGameStore.getState();
    expect(state.phase).toBe('vote');
    expect(state.current!.vote).toEqual({ kickedId: null });
  });
});

describe('castKick', () => {
  it('catching the imposter resolves outcome as caught (sub-round 1, knowers +3)', () => {
    const { imposterId } = driveToRound(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().openVote();
    useGameStore.getState().castKick(imposterId);

    const state = useGameStore.getState();
    expect(state.phase).toBe('outcome');
    expect(state.current!.resolvedOutcome).toBe('caught');
    expect(state.history).toHaveLength(1);
    // Caught at sub-round 1: imposter 0, each knower +3
    expect(state.scores[imposterId]).toBe(0);
    // Every other player should have +3
    const knowerIds = state.players
      .filter((p) => p.id !== imposterId)
      .map((p) => p.id);
    for (const kid of knowerIds) {
      expect(state.scores[kid]).toBe(3);
    }
  });

  it('first wrong kick advances to круг 2 and stays in round', () => {
    const { imposterId } = driveToRound(['Ana', 'Marko', 'Elena']);
    // Pick a knower to kick
    const knowerId = useGameStore
      .getState()
      .players.find((p) => p.id !== imposterId)!.id;

    useGameStore.getState().openVote();
    useGameStore.getState().castKick(knowerId);

    const state = useGameStore.getState();
    // Cap is 2, next круг = 2, which is ≤ cap, so phase goes back to 'round'
    expect(state.phase).toBe('round');
    expect(state.current!.subRound).toBe(2);
    expect(state.current!.resolvedOutcome).toBeNull();
    expect(state.current!.kickedOutIds).toEqual([knowerId]);
  });

  it('two wrong kicks exhaust the cap and resolve as survived', () => {
    const { imposterId } = driveToRound(['Ana', 'Marko', 'Elena']);
    const knowerIds = useGameStore
      .getState()
      .players.filter((p) => p.id !== imposterId)
      .map((p) => p.id);

    // First wrong kick → advances to sub-round 2
    useGameStore.getState().openVote();
    useGameStore.getState().castKick(knowerIds[0]!);

    expect(useGameStore.getState().phase).toBe('round');
    expect(useGameStore.getState().current!.subRound).toBe(2);

    // Second wrong kick → cap reached → survived
    useGameStore.getState().openVote();
    useGameStore.getState().castKick(knowerIds[1]!);

    const state = useGameStore.getState();
    expect(state.phase).toBe('outcome');
    expect(state.current!.resolvedOutcome).toBe('survived');
    expect(state.history).toHaveLength(1);
    // Survived: imposter +7, others 0
    expect(state.scores[imposterId]).toBe(7);
    for (const kid of knowerIds) {
      expect(state.scores[kid]).toBe(0);
    }
  });

  it('catching imposter at cap sub-round resolves as caught (not survived)', () => {
    // 3 players → cap is 2
    const { imposterId } = driveToRound(['Ana', 'Marko', 'Elena']);
    const knowerIds = useGameStore
      .getState()
      .players.filter((p) => p.id !== imposterId)
      .map((p) => p.id);

    // First wrong kick → sub-round 2 (== cap)
    useGameStore.getState().openVote();
    useGameStore.getState().castKick(knowerIds[0]!);
    expect(useGameStore.getState().phase).toBe('round');
    expect(useGameStore.getState().current!.subRound).toBe(2);

    // Now catch the imposter on the cap sub-round → caught scoring
    useGameStore.getState().openVote();
    useGameStore.getState().castKick(imposterId);

    const state = useGameStore.getState();
    expect(state.phase).toBe('outcome');
    // Catching the imposter is always `caught`, regardless of sub-round
    expect(state.current!.resolvedOutcome).toBe('caught');
    expect(state.current!.subRound).toBe(2);
    // Caught at sub-round 2: imposter +1, active knower +2, kicked knower 0
    expect(state.scores[imposterId]).toBe(1);
    expect(state.scores[knowerIds[0]!]).toBe(0); // wrongly kicked → excluded
    expect(state.scores[knowerIds[1]!]).toBe(2); // active knower
  });

  it('catching imposter before cap круг still resolves as caught', () => {
    // 5 players → cap is 3, so caught at sub-round 2 is well before the cap.
    const { imposterId } = driveToRound(['Ana', 'Marko', 'Elena', 'Petar', 'Viktor']);
    const state = useGameStore.getState();
    expect(state.current!.subRound).toBe(1);

    useGameStore.getState().openVote();
    useGameStore.getState().castKick(imposterId);

    const after = useGameStore.getState();
    expect(after.current!.resolvedOutcome).toBe('caught');
    expect(after.current!.subRound).toBe(1);
    // Caught at sub-round 1: imposter 0, each knower +3
    expect(after.scores[imposterId]).toBe(0);
    const knowerIds = after.players
      .filter((p) => p.id !== imposterId)
      .map((p) => p.id);
    for (const kid of knowerIds) {
      expect(after.scores[kid]).toBe(3);
    }
  });
});

describe('imposterGuessed', () => {
  it('short-circuits to outcome with imposter +5', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().imposterGuessed();

    const state = useGameStore.getState();
    expect(state.phase).toBe('outcome');
    expect(state.current!.resolvedOutcome).toBe('guessed');
    expect(state.history).toHaveLength(1);

    const imposterId = state.current!.imposterId;
    expect(state.scores[imposterId]).toBe(5);

    // Others get 0
    const knowerIds = state.players
      .filter((p) => p.id !== imposterId)
      .map((p) => p.id);
    for (const kid of knowerIds) {
      expect(state.scores[kid]).toBe(0);
    }
  });
});

describe('resolveOutcome updates history + scores', () => {
  it('ignores direct calls before a round has been resolved', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    const before = useGameStore.getState();

    before.resolveOutcome('caught');

    const after = useGameStore.getState();
    expect(after.phase).toBe('round');
    expect(after.history).toHaveLength(0);
    expect(after.scores).toEqual(before.scores);
  });

  it('creates a round record and applies deltas', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().imposterGuessed();

    const state = useGameStore.getState();
    expect(state.history).toHaveLength(1);
    const record = state.history[0]!;
    expect(record.outcome).toBe('guessed');
    expect(record.deltas[state.current!.imposterId]).toBe(5);
    // Check that history record has all expected fields
    expect(record.word).toBeDefined();
    expect(record.hintUsed).toBeDefined();
    expect(record.difficulty).toBeDefined();
    expect(record.imposterId).toBeDefined();
    expect(record.caughtAtSubRound).toBeNull();
  });
});

describe('nextRound', () => {
  it('creates a new round at the same difficulty and transitions to reveal', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    // End the round first
    useGameStore.getState().imposterGuessed();
    expect(useGameStore.getState().phase).toBe('outcome');

    const beforeDifficulty = useGameStore.getState().current!.difficulty;
    useGameStore.getState().nextRound();
    const state = useGameStore.getState();
    expect(state.current).not.toBeNull();
    expect(state.phase).toBe('reveal');
    expect(state.current!.difficulty).toBe(beforeDifficulty);
  });

  it('preserves difficulty from the previous round', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();
    store.setDifficulty('high');
    // Advance through reveal
    const revealCount = useGameStore.getState().current!.revealOrder.length;
    for (let i = 0; i < revealCount; i++) {
      useGameStore.getState().advanceReveal();
    }
    useGameStore.getState().imposterGuessed();
    useGameStore.getState().nextRound();
    const state = useGameStore.getState();
    expect(state.current!.difficulty).toBe('high');
  });
});

describe('endTournament', () => {
  it('transitions to finale from outcome phase', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().imposterGuessed();
    useGameStore.getState().endTournament();
    expect(useGameStore.getState().phase).toBe('finale');
  });

  it('transitions to finale from mid-game', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    // While in round, end tournament
    useGameStore.getState().endTournament();
    expect(useGameStore.getState().phase).toBe('finale');
  });
});

describe('resumeRound', () => {
  it('restores the saved game phase after the lobby is shown', () => {
    driveToRound(['Ana', 'Marko', 'Elena']);
    useGameStore.setState({
      phase: 'lobby',
      resumePhase: 'round',
      resumeDismissed: false,
    });

    useGameStore.getState().resumeRound();

    const state = useGameStore.getState();
    expect(state.phase).toBe('round');
    expect(state.resumePhase).toBeNull();
    expect(state.resumeDismissed).toBe(true);
    expect(state.current).not.toBeNull();
  });

  it('does nothing when no saved phase exists', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    useGameStore.setState({ phase: 'lobby', resumePhase: null });

    useGameStore.getState().resumeRound();

    expect(useGameStore.getState().phase).toBe('lobby');
  });
});

describe('resetAll', () => {
  it('clears everything and goes back to lobby', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();
    store.setDifficulty('low');
    store.advanceReveal();
    store.resetAll();

    const state = useGameStore.getState();
    expect(state.players).toEqual([]);
    expect(state.scores).toEqual({});
    expect(state.history).toEqual([]);
    expect(state.current).toBeNull();
    expect(state.phase).toBe('lobby');
    expect(state.resumeDismissed).toBe(false);
    expect(state.subRoundCapOverride).toBeNull();
  });
});

describe('restartTournament', () => {
  it('keeps players but resets scores, history, current, and goes to lobby', () => {
    const ids = seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();
    store.setDifficulty('low');
    // Play through a round to generate history and scores
    const imposterId = useGameStore.getState().current!.imposterId;
    useGameStore.getState().openVote();
    useGameStore.getState().castKick(imposterId); // caught at sub-round 1

    const before = useGameStore.getState();
    expect(before.phase).toBe('outcome');
    expect(Object.keys(before.scores)).toHaveLength(3);
    expect(before.history).toHaveLength(1);

    store.restartTournament();
    const state = useGameStore.getState();
    expect(state.players).toHaveLength(3);
    expect(state.players.map((p) => p.id)).toEqual(ids);
    expect(Object.values(state.scores).every((v) => v === 0)).toBe(true);
    expect(state.history).toEqual([]);
    expect(state.current).toBeNull();
    expect(state.phase).toBe('lobby');
  });

  it('works from any phase, not just outcome', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    const store = useGameStore.getState();
    store.startTournament();
    store.setDifficulty('low');
    // restart mid-reveal
    store.restartTournament();
    const state = useGameStore.getState();
    expect(state.players).toHaveLength(3);
    expect(state.phase).toBe('lobby');
    expect(state.current).toBeNull();
  });
});

describe('setSubRoundCapOverride', () => {
  it('store reflects the override', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    useGameStore.getState().setSubRoundCapOverride(5);
    expect(useGameStore.getState().subRoundCapOverride).toBe(5);
  });

  it('effective cap picks override over auto-computed', () => {
    seedPlayers(['Ana', 'Marko', 'Elena']);
    // 3 players → auto cap is 2
    expect(computeSubRoundCap(useGameStore.getState().players)).toBe(2);

    // Override to 5
    useGameStore.getState().setSubRoundCapOverride(5);
    const override = useGameStore.getState().subRoundCapOverride;
    expect(override).toBe(5);

    // Effective cap: override (5) over auto (2)
    const effective =
      override ?? computeSubRoundCap(useGameStore.getState().players);
    expect(effective).toBe(5);
  });

  it('setting override to null restores auto-computed cap', () => {
    seedPlayers(['Ana', 'Marko', 'Elena', 'Petar', 'Viktor']);
    // 5 players → auto cap is 3
    expect(computeSubRoundCap(useGameStore.getState().players)).toBe(3);

    useGameStore.getState().setSubRoundCapOverride(10);
    expect(useGameStore.getState().subRoundCapOverride).toBe(10);

    useGameStore.getState().setSubRoundCapOverride(null);
    expect(useGameStore.getState().subRoundCapOverride).toBeNull();
  });
});
