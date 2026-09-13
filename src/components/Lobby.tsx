import { useState } from 'react';
import {
  usePlayers,
  useHistory,
  useSubRoundCapOverride,
  useEffectiveSubRoundCap,
} from '../store/selectors';
import { useGameStore } from '../store/gameStore';
import { computeSubRoundCap } from '../game/subRoundCap';
import { Button } from './Button';
import { Logo } from './Logo';
import { HowToPlay } from './HowToPlay';
import { ConfirmDialog } from './ConfirmDialog';

const CAP_OPTIONS = [2, 3, 4, 5] as const;

export function Lobby() {
  const [name, setName] = useState('');
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const players = usePlayers();
  const history = useHistory();
  const override = useSubRoundCapOverride();
  const effectiveCap = useEffectiveSubRoundCap();
  const autoCap = computeSubRoundCap(players);

  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const setSubRoundCapOverride = useGameStore((s) => s.setSubRoundCapOverride);
  const startTournament = useGameStore((s) => s.startTournament);
  const endTournament = useGameStore((s) => s.endTournament);
  const resetAll = useGameStore((s) => s.resetAll);

  const trimmed = name.trim();
  const canAdd = trimmed.length > 0;
  const canStart = players.length >= 3;
  const hasHistory = history.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addPlayer(name);
    setName('');
  }

  function handleReset() {
    setResetOpen(true);
  }

  return (
    <>
    <div className="flex flex-col flex-1 gap-6 animate-fade-in">
      {/* ── Logo ── */}
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>

      {/* ── Играчи ── */}
      <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Играчи
        </h2>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Име на играч"
            className="flex-1 h-12 min-h-12 px-4 rounded-xl bg-surface border border-border text-text placeholder-text-dim outline-none focus:border-accent transition-colors"
          />
          <Button
            type="submit"
            variant="secondary"
            size="md"
            disabled={!canAdd}
          >
            Додај
          </Button>
        </form>

        {players.length === 0 ? (
          <p className="text-center text-text-dim text-sm py-8 rounded-2xl border border-dashed border-border">
            Додајте барем 3 играчи за да почнете.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {players.map((p) => (
              <div
                key={p.id}
                className="inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-surface-2 text-text text-sm animate-pop-in"
              >
                <span>{p.name}</span>
                <button
                  type="button"
                  onClick={() => removePlayer(p.id)}
                  className="w-10 h-10 min-h-10 -mr-1.5 flex items-center justify-center rounded-full text-text-dim hover:text-text hover:bg-surface transition-colors text-sm cursor-pointer"
                  aria-label={`Отстрани ${p.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Максимален број кругови ── */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
          Максимален број кругови
        </h2>

        <div className="text-5xl font-bold text-accent text-center my-3">
          {effectiveCap}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={() => setSubRoundCapOverride(null)}
            className={
              'px-5 py-2 min-h-12 rounded-full text-sm transition-colors select-none touch-manipulation cursor-pointer ' +
              (override === null
                ? 'bg-accent text-bg'
                : 'bg-surface text-text-muted border border-border hover:bg-surface-2')
            }
          >
            Автоматски ({autoCap})
          </button>
          {CAP_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSubRoundCapOverride(n)}
              className={
                'px-5 py-2 min-h-12 rounded-full text-sm transition-colors select-none touch-manipulation cursor-pointer ' +
                (override === n
                  ? 'bg-accent text-bg'
                  : 'bg-surface text-text-muted border border-border hover:bg-surface-2')
              }
            >
              {n}
            </button>
          ))}
        </div>

        <p className="text-xs text-text-dim text-center mt-2">
          Бројот се пресметува според бројот на играчи.
        </p>
      </section>

      {/* ── Actions ── */}
      <div className="flex flex-col gap-3 mt-auto animate-pop-in">
        <Button
          fullWidth
          variant="primary"
          size="lg"
          disabled={!canStart}
          onClick={startTournament}
        >
          Започни турнир
        </Button>
        {!canStart && (
          <p className="text-xs text-text-dim text-center">
            Додајте најмалку 3 играчи за да започнете.
          </p>
        )}

        <Button
          fullWidth
          variant="secondary"
          size="md"
          onClick={() => setHowToPlayOpen(true)}
        >
          Како се игра?
        </Button>

        {hasHistory && (
          <>
            <Button
              fullWidth
              variant="secondary"
              size="md"
              onClick={endTournament}
            >
              Погледни ги резултатите
            </Button>
            <Button
              fullWidth
              variant="ghost"
              size="md"
              onClick={handleReset}
            >
              Избриши ги сите податоци
            </Button>
          </>
        )}
      </div>
    </div>

    <HowToPlay open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
    <ConfirmDialog
      open={resetOpen}
      title="Избриши ги податоците?"
      message="Сè ќе биде избришано — играчи, поени и историја."
      confirmLabel="Избриши сè"
      variant="danger"
      onConfirm={() => { setResetOpen(false); resetAll(); }}
      onCancel={() => setResetOpen(false)}
    />
    </>);
}
