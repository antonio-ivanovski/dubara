import { usePlayers, useScores, useHistory } from '../store/selectors';
import type { OutcomeKind } from '../store/types';

interface ScoreboardProps {
  open: boolean;
  onClose: () => void;
}

const OUTCOME_LABEL: Record<OutcomeKind, string> = {
  guessed: 'го погоди зборот',
  survived: 'преживеа',
  caught: 'беше откриен',
};

export function Scoreboard({ open, onClose }: ScoreboardProps) {
  const players = usePlayers();
  const scores = useScores();
  const history = useHistory();

  if (!open) return null;

  const sortedPlayers = [...players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );

  const lastRecord = history.length > 0 ? history[history.length - 1] : null;
  const lastImposterName = lastRecord
    ? players.find((p) => p.id === lastRecord.imposterId)?.name ?? '?'
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface border border-border p-5 max-h-[85svh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">Резултати</h2>
          <button
            onClick={onClose}
            className="w-12 h-12 min-h-12 flex items-center justify-center rounded-xl text-text-dim hover:text-text hover:bg-surface-2 transition-colors active:scale-[0.98] touch-manipulation select-none"
            aria-label="Затвори"
          >
            ✕
          </button>
        </div>

        {/* ── Player list ── */}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {sortedPlayers.length === 0 ? (
            <p className="text-text-dim text-sm text-center py-4">
              Нема играчи.
            </p>
          ) : (
            sortedPlayers.map((p) => {
              const total = scores[p.id] ?? 0;
              const delta =
                history.length > 0
                  ? history[history.length - 1].deltas[p.id] ?? 0
                  : 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3"
                >
                  <span className="text-text font-medium">{p.name}</span>
                  <span className="flex items-center gap-2">
                    {delta !== 0 && (
                      <span
                        className={
                          'text-xs font-semibold tabular-nums ' +
                          (delta > 0 ? 'text-tier-low' : 'text-imposter')
                        }
                      >
                        {delta > 0 ? '+' : ''}
                        {delta}
                      </span>
                    )}
                    <span className="text-text font-bold text-base tabular-nums">
                      {total}
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* ── Last round summary ── */}
        {lastRecord && lastImposterName && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-text-dim">
              Последна рунда: {lastImposterName} —{' '}
              {OUTCOME_LABEL[lastRecord.outcome]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
