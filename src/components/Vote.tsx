import {
  useCurrent,
  usePlayers,
  useEffectiveSubRoundCap,
  useKickedOutIds,
} from '../store/selectors';
import { useGameStore } from '../store/gameStore';
import { Button } from './Button';

export function Vote() {
  const current = useCurrent();
  const players = usePlayers();
  const subRoundCap = useEffectiveSubRoundCap();
  const kickedOutIds = useKickedOutIds();

  const castKick = useGameStore((s) => s.castKick);
  const imposterGuessed = useGameStore((s) => s.imposterGuessed);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <p className="text-text-muted">Нема активна рунда.</p>
      </div>
    );
  }

  const { subRound } = current;

  const activePlayers = players.filter((p) => !kickedOutIds.includes(p.id));
  const kickedPlayers = players.filter((p) => kickedOutIds.includes(p.id));
  const onlyImposterActive =
    activePlayers.length === 1 &&
    activePlayers[0].id === current.imposterId;

  return (
    <div className="animate-fade-in flex flex-col flex-1 gap-3 pt-2">
      {/* ── Imposter guessed — shortcut win ── */}
      <Button
        variant="danger"
        size="md"
        fullWidth
        className="animate-glow-pulse"
        onClick={imposterGuessed}
      >
        ДУБАРАта го погоди зборот
      </Button>

      {/* ── Header chip + phase pill ── */}
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-imposter-bg text-imposter border border-imposter/30 text-sm font-medium">
          Гласање · Круг {subRound} / {subRoundCap}
        </span>
      </div>

      {/* ── Kicked player indicator ── */}
      {kickedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {kickedPlayers.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center px-3 py-1 rounded-full bg-tier-mid/10 text-tier-mid text-sm border border-tier-mid/20 animate-shake"
            >
              Исфрлен: {p.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Prompt ── */}
      <h2 className="text-2xl font-bold text-text text-center">
        Кого го сомничите за ДУБАРА?
      </h2>

      {/* ── Player grid (filtered) ── */}
      <div className="flex-1" />
      {onlyImposterActive || activePlayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-text-muted text-center">
            Нема активни играчи за гласање. ДУБАРАта победува.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {activePlayers.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => castKick(p.id)}
              className="w-full min-h-16 rounded-2xl bg-surface border border-border text-text text-lg font-medium transition-colors active:scale-[0.98] touch-manipulation select-none cursor-pointer animate-pop-in"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
