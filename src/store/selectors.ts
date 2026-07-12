import { computeSubRoundCap } from '../game/subRoundCap';
import { useGameStore } from './gameStore';
import type { Phase, Player, PlayerId } from './types';

export function usePhase(): Phase {
  return useGameStore((s) => s.phase);
}

export function usePlayers(): Player[] {
  return useGameStore((s) => s.players);
}

export function useCurrent() {
  return useGameStore((s) => s.current);
}

export function useScores() {
  return useGameStore((s) => s.scores);
}

export function useHistory() {
  return useGameStore((s) => s.history);
}

export function useSubRoundCapOverride() {
  return useGameStore((s) => s.subRoundCapOverride);
}

export function useEffectiveSubRoundCap(): number {
  const players = usePlayers();
  const override = useSubRoundCapOverride();
  return override ?? computeSubRoundCap(players);
}

export function usePlayerName(id: PlayerId | null | undefined): string {
  return useGameStore((s) => {
    if (!id) return '';
    return s.players.find((p) => p.id === id)?.name ?? '';
  });
}

export function useIsResumable(): boolean {
  return useGameStore((s) => !s.resumeDismissed && s.current !== null);
}

export function useKickedOutIds(): string[] {
  return useGameStore((s) => s.current?.kickedOutIds ?? []);
}

export function useLastKickedId(): string | null {
  return useGameStore((s) => s.current?.vote?.kickedId ?? null);
}
