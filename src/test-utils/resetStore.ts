import { useGameStore } from '../store/gameStore';
import type { Player } from '../store/types';

export function makePlayers(n: number, prefix = 'p'): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    name: `Player${i + 1}`,
  }));
}

export function resetStore(): void {
  localStorage.clear();
  useGameStore.getState().resetAll();
}

/**
 * Reset the store, add players by name, and return the auto-generated IDs.
 */
export function seedPlayers(names: string[]): string[] {
  resetStore();
  const store = useGameStore.getState();
  for (const n of names) store.addPlayer(n);
  return useGameStore.getState().players.map((p) => p.id);
}
