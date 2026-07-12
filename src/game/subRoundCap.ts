import type { Player } from '../store/types';

export function computeSubRoundCap(players: Player[]): number {
  if (players.length < 3) return 2;
  return Math.max(2, Math.ceil(players.length / 2));
}