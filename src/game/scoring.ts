import type {
  CurrentRound,
  OutcomeKind,
  PlayerId,
  RoundRecord,
} from '../store/types';

export interface ResolveOutcomeResult {
  deltas: Record<PlayerId, number>;
  record: RoundRecord;
}

export function resolveOutcome(
  current: CurrentRound,
  playerIds: PlayerId[],
): ResolveOutcomeResult {
  const deltas: Record<PlayerId, number> = Object.fromEntries(
    playerIds.map((id) => [id, 0]),
  );

  switch (current.resolvedOutcome) {
    case 'guessed':
      deltas[current.imposterId] = (deltas[current.imposterId] ?? 0) + 5;
      break;

    case 'survived':
      deltas[current.imposterId] = (deltas[current.imposterId] ?? 0) + 7;
      break;

    case 'caught': {
      const N = current.subRound;
      const imposterBonus = Math.floor(N / 2);
      const knowerBonus = Math.max(1, 4 - N);
      const kicked = new Set(current.kickedOutIds ?? []);
      deltas[current.imposterId] =
        (deltas[current.imposterId] ?? 0) + imposterBonus;
      for (const id of playerIds) {
        if (id === current.imposterId) continue;
        if (kicked.has(id)) continue; // kicked-out players get 0
        deltas[id] = (deltas[id] ?? 0) + knowerBonus;
      }
      break;
    }

    default:
      break;
  }

  const record: RoundRecord = {
    word: current.word,
    hintUsed: current.hintUsed,
    difficulty: current.difficulty,
    imposterId: current.imposterId,
    outcome: (current.resolvedOutcome ?? 'caught') as OutcomeKind,
    caughtAtSubRound:
      current.resolvedOutcome === 'caught' ? current.subRound : null,
    kickedOutIds: [...(current.kickedOutIds ?? [])],
    deltas,
  };

  return { deltas, record };
}

export function applyDeltas(
  scores: Record<PlayerId, number>,
  deltas: Record<PlayerId, number>,
): Record<PlayerId, number> {
  const next: Record<PlayerId, number> = { ...scores };
  for (const [id, delta] of Object.entries(deltas)) {
    next[id] = (next[id] ?? 0) + delta;
  }
  return next;
}
