import { useGameStore } from '../store/gameStore';
import type { Difficulty } from '../store/types';
import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS } from '../store/types';

const TIERS: Difficulty[] = ['low', 'mid', 'high'];

export function DifficultyPick() {
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  return (
    <div className="flex flex-col flex-1 gap-5 pt-2">
      <h2 className="text-xl font-semibold text-center">
        Изберете тежина
      </h2>

      <div className="flex flex-col gap-3">
        {TIERS.map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className="w-full min-h-24 flex flex-col items-center justify-center gap-1 rounded-2xl p-5 bg-surface border border-border text-text transition-colors active:scale-[0.98] touch-manipulation select-none"
          >
            <span className="text-2xl font-bold">{DIFFICULTY_LABELS[d]}</span>
            <span className="text-sm text-text-muted">
              {DIFFICULTY_DESCRIPTIONS[d]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
