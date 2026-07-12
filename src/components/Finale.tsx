import { usePlayers, useScores, useHistory } from '../store/selectors';
import { useGameStore } from '../store/gameStore';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';

export function Finale() {
  const players = usePlayers();
  const scores = useScores();
  const history = useHistory();

  const restartTournament = useGameStore((s) => s.restartTournament);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sortedPlayers = [...players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );

  const imposterWins = history.filter(
    (r) => r.outcome === 'guessed' || r.outcome === 'survived',
  ).length;
  const knowerWins = history.filter((r) => r.outcome === 'caught').length;

  function handleNewTournament() {
    setConfirmOpen(true);
  }

  return (
    <div className="flex flex-col flex-1 gap-6 pt-2">
      {/* ── Heading ── */}
      <h1 className="text-2xl font-bold text-text text-center">
        Турнирот заврши!
      </h1>

      {/* ── Final standings ── */}
      <section className="rounded-2xl bg-surface border border-border p-4">
        <p className="text-xs text-text-dim uppercase tracking-wider mb-3">
          Конечен редослед
        </p>
        <div className="flex flex-col gap-2">
          {sortedPlayers.length === 0 ? (
            <p className="text-text-dim text-sm text-center py-4">
              Нема играчи.
            </p>
          ) : (
            sortedPlayers.map((p, idx) => {
              const total = scores[p.id] ?? 0;
              const isWinner = idx === 0 && sortedPlayers.length > 0;
              return (
                <div
                  key={p.id}
                  className={
                    'flex items-center justify-between rounded-xl px-4 py-3 ' +
                    (isWinner
                      ? 'bg-knower-bg border border-knower/30'
                      : 'bg-surface-2')
                  }
                >
                  <div className="flex items-center gap-2">
                    {isWinner && (
                      <span className="text-tier-mid text-lg leading-none">
                        👑
                      </span>
                    )}
                    <span
                      className={
                        'font-medium ' +
                        (isWinner ? 'text-knower' : 'text-text')
                      }
                    >
                      {p.name}
                    </span>
                  </div>
                  <span className="text-text font-bold text-lg tabular-nums">
                    {total}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="rounded-2xl bg-surface border border-border p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-text">{history.length}</p>
            <p className="text-xs text-text-dim mt-0.5">Вкупно рунди</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-imposter">{imposterWins}</p>
            <p className="text-xs text-text-dim mt-0.5">Победи на ДУБАРАта</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-knower">{knowerWins}</p>
            <p className="text-xs text-text-dim mt-0.5">Победи на знајците</p>
          </div>
        </div>
      </section>

      {/* ── Action ── */}
      <div className="mt-auto pt-4">
        <Button variant="primary" size="lg" fullWidth onClick={handleNewTournament}>
          Нов турнир
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Нов турнир?"
        message="Поените и историјата ќе бидат избришани. Играчите се зачувани."
        confirmLabel="Започни нов"
        onConfirm={() => { setConfirmOpen(false); restartTournament(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
