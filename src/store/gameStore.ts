import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { WORDS } from '../game/words';
import { pickRandom, shuffle } from '../game/shuffle';
import { applyDeltas, resolveOutcome } from '../game/scoring';
import { computeSubRoundCap } from '../game/subRoundCap';

import type {
  CurrentRound,
  Difficulty,
  GameStore,
  OutcomeKind,
  Player,
  PlayerId,
  Phase,
} from './types';

function makeId(): PlayerId {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function buildRevealOrder(players: Player[], imposterId: PlayerId): PlayerId[] {
  const others = players.filter((p) => p.id !== imposterId).map((p) => p.id);
  return shuffle([imposterId, ...others]);
}

function pickWord(history: GameStore['history']): (typeof WORDS)[number] {
  const used = new Set(history.map((record) => record.word.word));
  const available = WORDS.filter((word) => !used.has(word.word));
  if (available.length > 0) return pickRandom(available);

  // Start a fresh cycle after the dictionary is exhausted, avoiding an
  // immediate repeat whenever there is more than one word available.
  const last = history.at(-1)?.word.word;
  const freshCycle = WORDS.filter((word) => WORDS.length === 1 || word.word !== last);
  return pickRandom(freshCycle);
}

function buildCurrent(args: {
  difficulty: Difficulty;
  imposterId: PlayerId;
  players: Player[];
  history: GameStore['history'];
}): CurrentRound {
  const word = pickWord(args.history);
  const hintPool = word.hints[args.difficulty];
  const hintUsed = pickRandom(hintPool);
  return {
    word,
    hintUsed,
    difficulty: args.difficulty,
    imposterId: args.imposterId,
    revealOrder: buildRevealOrder(args.players, args.imposterId),
    revealIndex: 0,
    subRound: 1,
    speakingIndex: 0,
    vote: null,
    resolvedOutcome: null,
    kickedOutIds: [],
    startedAt: Date.now(),
  };
}

const RESUMABLE_PHASES = new Set<Phase>(['reveal', 'round', 'vote', 'outcome']);

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      players: [],
      subRoundCapOverride: null,
      scores: {},
      history: [],
      current: null,
      phase: 'lobby',
      resumePhase: null,
      resumeDismissed: false,

      addPlayer(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          players: [...s.players, { id: makeId(), name: trimmed }],
        }));
      },

      removePlayer(id) {
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
          scores: Object.fromEntries(
            Object.entries(s.scores).filter(([pid]) => pid !== id),
          ),
          history: s.history.map((r) => {
            if (r.deltas[id] === undefined && !r.kickedOutIds?.includes(id)) {
              return r;
            }
            const next = { ...r.deltas };
            delete next[id];
            return { ...r, deltas: next };
          }),
        }));
      },

      setSubRoundCapOverride(value) {
        set({ subRoundCapOverride: value });
      },

      startTournament() {
        const { players } = get();
        if (players.length < 3) return;
        const scores: Record<PlayerId, number> = {};
        for (const p of players) scores[p.id] = 0;
        set({
          scores,
          history: [],
          current: null,
          phase: 'difficultyPick',
          resumePhase: null,
          resumeDismissed: true,
        });
      },

      setDifficulty(difficulty) {
        const { players } = get();
        if (players.length < 3) return;
        const imposter = pickRandom(players);
        const current = buildCurrent({
          difficulty,
          imposterId: imposter.id,
          players,
          history: [],
        });
        set({
          current,
          phase: 'reveal',
          resumePhase: null,
          resumeDismissed: true,
        });
      },

      advanceReveal() {
        const { current } = get();
        if (!current) return;
        const next = current.revealIndex + 1;
        if (next >= current.revealOrder.length) {
          // Pick a random first speaker for the round phase.
          const firstSpeakerIndex = Math.floor(
            Math.random() * current.revealOrder.length,
          );
          set({
            current: {
              ...current,
              revealIndex: 0,
              speakingIndex: firstSpeakerIndex,
            },
            phase: 'round',
          });
        } else {
          set({ current: { ...current, revealIndex: next } });
        }
      },

      openVote() {
        const { current } = get();
        if (!current) return;
        set({
          current: { ...current, vote: { kickedId: null } },
          phase: 'vote',
        });
      },

      castKick(id) {
        const { current } = get();
        if (!current) return;
        const caught = id === current.imposterId;
        if (caught) {
          // Catching the imposter is always `caught`, regardless of sub-round.
          // The cap-survived logic only applies in advanceSubRound (wrong kicks).
          const outcome: OutcomeKind = 'caught';
          set({
            current: {
              ...current,
              vote: { kickedId: id },
              resolvedOutcome: outcome,
            },
            phase: 'outcome',
          });
          get().resolveOutcome(outcome);
        } else {
          // Wrong kick: record the player as kicked out and advance the круг.
          const updated: CurrentRound = {
            ...current,
            kickedOutIds: [...current.kickedOutIds, id],
            vote: { kickedId: id },
          };
          set({ current: updated });
          get().advanceSubRound();
        }
      },

      imposterGuessed() {
        const { current } = get();
        if (!current) return;
        set({
          current: { ...current, resolvedOutcome: 'guessed' },
          phase: 'outcome',
        });
        get().resolveOutcome('guessed');
      },

      advanceSubRound() {
        const { current } = get();
        if (!current) return;
        const cap =
          get().subRoundCapOverride ?? computeSubRoundCap(get().players);
        const nextSub = current.subRound + 1;
        if (nextSub > cap) {
          set({
            current: {
              ...current,
              subRound: cap,
              resolvedOutcome: 'survived',
              vote: { kickedId: null },
            },
            phase: 'outcome',
          });
          get().resolveOutcome('survived');
        } else {
          set({
            current: {
              ...current,
              subRound: nextSub,
              speakingIndex: 0,
              vote: null,
            },
            phase: 'round',
          });
        }
      },

      resolveOutcome(kind: OutcomeKind) {
        const { current, players, scores, history } = get();
        if (!current || current.resolvedOutcome === null) return;
        const draft: CurrentRound = { ...current, resolvedOutcome: kind };
        const { deltas, record } = resolveOutcome(
          draft,
          players.map((p) => p.id),
        );
        const nextScores = applyDeltas(scores, deltas);
        set({
          current: draft,
          scores: nextScores,
          history: [...history, record],
          phase: 'outcome',
        });
      },

      nextRound() {
        const { current, players } = get();
        if (!current) return;
        // Pick a fresh word + imposter + hint at the same difficulty for the next round.
        const imposter = pickRandom(players);
        const nextCurrent = buildCurrent({
          difficulty: current.difficulty,
          imposterId: imposter.id,
          players,
          history: get().history,
        });
        set({ current: nextCurrent, phase: 'reveal', resumePhase: null });
      },

      endTournament() {
        set({ phase: 'finale', resumePhase: null });
      },

      restartTournament() {
        // Keep players; reset scores, history, and current; return to lobby.
        const { players } = get();
        const scores: Record<PlayerId, number> = {};
        for (const p of players) scores[p.id] = 0;
        set({
          scores,
          history: [],
          current: null,
          phase: 'lobby',
          resumePhase: null,
        });
      },

      resumeRound() {
        const { current, resumePhase } = get();
        if (!current || !resumePhase || !RESUMABLE_PHASES.has(resumePhase)) return;
        set({ phase: resumePhase, resumePhase: null, resumeDismissed: true });
      },

      resetAll() {
        set({
          players: [],
          subRoundCapOverride: null,
          scores: {},
          history: [],
          current: null,
          phase: 'lobby',
          resumePhase: null,
          resumeDismissed: false,
        });
      },

      dismissResume() {
        set({ resumeDismissed: true });
      },
    }),
    {
      name: 'dubara-game-v2',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        players: s.players,
        subRoundCapOverride: s.subRoundCapOverride,
        scores: s.scores,
        history: s.history,
        current: s.current,
        phase: s.phase,
        resumePhase: s.resumePhase,
      }),
      migrate: (persisted, _version) => persisted as GameStore,
      onRehydrateStorage: () => (state) => {
        if (!state?.current || !RESUMABLE_PHASES.has(state.phase)) return;
        useGameStore.setState({
          phase: 'lobby',
          resumePhase: state.phase,
          resumeDismissed: false,
        });
      },
    },
  ),
);
