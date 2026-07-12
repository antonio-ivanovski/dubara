import { useCurrent, usePlayers, useScores, useHistory } from '../store/selectors';
import { useGameStore } from '../store/gameStore';
import { Button } from './Button';
import type { Difficulty, OutcomeKind } from '../store/types';

const CONFETTI_COLORS = ['#c084fc', '#22c55e', '#38bdf8', '#f59e0b', '#f97316', '#ef4444'];

const CONFETTI_PIECES = Array.from({ length: 8 }, (_, i) => ({
  x: 10 + Math.random() * 80,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: i * 120 + Math.random() * 200,
}));

const TIER_COLOR: Record<Difficulty, string> = {
  low: 'text-tier-low',
  mid: 'text-tier-mid',
  high: 'text-tier-high',
};

const TIER_BORDER: Record<Difficulty, string> = {
  low: 'border-tier-low',
  mid: 'border-tier-mid',
  high: 'border-tier-high',
};

const TIER_BG: Record<Difficulty, string> = {
  low: 'bg-tier-low/10',
  mid: 'bg-tier-mid/10',
  high: 'bg-tier-high/10',
};

interface BannerConfig {
  title: string;
  subtitle: string;
  bannerBg: string;
  bannerBorder: string;
  bannerText: string;
}

const OUTCOME_BANNER: Record<OutcomeKind, BannerConfig> = {
  guessed: {
    title: 'ДУБАРАта го погоди зборот!',
    subtitle: 'ДУБАРАта победува.',
    bannerBg: 'bg-imposter-bg',
    bannerBorder: 'border-imposter/30',
    bannerText: 'text-imposter',
  },
  survived: {
    title: 'ДУБАРАта преживеа!',
    subtitle: 'Знајците не успеаја.',
    bannerBg: 'bg-imposter-bg',
    bannerBorder: 'border-imposter/30',
    bannerText: 'text-imposter',
  },
  caught: {
    title: 'Знајците победуваат!',
    subtitle: 'ДУБАРАта беше откриен.',
    bannerBg: 'bg-knower-bg',
    bannerBorder: 'border-knower/30',
    bannerText: 'text-knower',
  },
};

export function Outcome() {
  const current = useCurrent();
  const players = usePlayers();
  const scores = useScores();
  const history = useHistory();

  const nextRound = useGameStore((s) => s.nextRound);
  const endTournament = useGameStore((s) => s.endTournament);

  if (!current || !current.resolvedOutcome) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <p className="text-text-muted">Нема резултат за оваа рунда.</p>
      </div>
    );
  }

  const outcome = current.resolvedOutcome;
  const banner = OUTCOME_BANNER[outcome];
  const imposterName = players.find((p) => p.id === current.imposterId)?.name ?? '?';
  const lastRecord = history.length > 0 ? history[history.length - 1] : null;

  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <div className="animate-fade-in flex flex-col flex-1 gap-3 pt-1">
      {/* ── Result banner ── */}
      <div
        className={
          'relative rounded-2xl border-2 p-4 text-center animate-pop-in ' +
          banner.bannerBg + ' ' + banner.bannerBorder +
          (outcome === 'caught' ? ' animate-glow-pulse' : '')
        }
        style={{ animationDelay: '0ms' }}
      >
        {/* ── Confetti overlay (caught only) ── */}
        {outcome === 'caught' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            {CONFETTI_PIECES.map((p, i) => (
              <span
                key={i}
                className="absolute w-2 h-2 rounded-sm animate-confetti"
                style={{
                  left: `${p.x}%`,
                  top: '-10px',
                  backgroundColor: p.color,
                  animationDelay: `${p.delay}ms`,
                }}
              />
            ))}
          </div>
        )}
        <h2 className={'text-xl font-bold leading-tight ' + banner.bannerText}>
          {banner.title}
        </h2>
        <p className="text-text-muted text-sm mt-1">{banner.subtitle}</p>
      </div>

      {/* ── Word pair reveal ── */}
      <section className="grid grid-cols-2 rounded-2xl bg-surface border border-border p-4 animate-pop-in" style={{ animationDelay: '100ms' }}>
        <div className="min-w-0 pr-3">
          <p className="text-xs text-text-dim uppercase tracking-wider mb-1">
            Тајниот збор:
          </p>
          <p className="text-2xl font-bold text-text break-words">{current.word.word}</p>
        </div>
        <div className="min-w-0 pl-3 border-l border-border">
          <p className="text-xs text-text-dim uppercase tracking-wider mb-2">
            Зборот на ДУБАРАТА:
          </p>
          <span
            className={
              'inline-block max-w-full px-3 py-1.5 rounded-full border text-sm font-medium break-words ' +
              TIER_COLOR[current.difficulty] + ' ' +
              TIER_BORDER[current.difficulty] + ' ' +
              TIER_BG[current.difficulty]
            }
          >
            {current.hintUsed}
          </span>
        </div>
      </section>

      {/* ── Imposter reveal ── */}
      <section className="rounded-2xl bg-imposter-bg border border-imposter/30 p-3 animate-pop-in" style={{ animationDelay: '200ms' }}>
        <p className="text-xs text-text-dim uppercase tracking-wider mb-1">
          ДУБАРАта беше играчот:
        </p>
        <p className="text-2xl font-bold text-imposter">{imposterName}</p>
      </section>

      {/* ── Scoreboard deltas ── */}
      <section className="rounded-2xl bg-surface border border-border p-3 animate-pop-in" style={{ animationDelay: '300ms' }}>
        <p className="text-xs text-text-dim uppercase tracking-wider mb-3">
          Резултати
        </p>
        <div className="flex flex-col gap-2">
          {sortedPlayers.map((p) => {
            const total = scores[p.id] ?? 0;
            const delta = lastRecord?.deltas[p.id] ?? 0;
            return (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-text text-sm">{p.name}</span>
                <span className="flex items-center gap-2">
                  {delta !== 0 && (
                    <span
                      className={
                        'text-xs font-semibold tabular-nums ' +
                        (delta > 0 ? 'text-tier-low' : 'text-imposter')
                      }
                    >
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                  <span className="text-text font-bold text-base tabular-nums">
                    {total}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="sticky bottom-0 z-10 -mx-4 grid grid-cols-2 gap-2 bg-bg/95 px-4 pt-3 pb-2 backdrop-blur-sm animate-pop-in" style={{ animationDelay: '400ms' }}>
        <Button variant="primary" size="md" fullWidth onClick={nextRound}>
          Следна рунда
        </Button>
        <Button variant="secondary" size="md" fullWidth onClick={endTournament}>
          Заврши турнир
        </Button>
      </div>
    </div>
  );
}
