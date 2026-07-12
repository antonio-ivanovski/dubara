import { useEffect, useState } from 'react';
import {
  useCurrent,
  useEffectiveSubRoundCap,
  useKickedOutIds,
  usePlayers,
} from '../store/selectors';
import { useGameStore } from '../store/gameStore';
import { Button } from './Button';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function RoundOrder() {
  const current = useCurrent();
  const subRoundCap = useEffectiveSubRoundCap();
  const kickedOutIds = useKickedOutIds();
  const players = usePlayers();

  const openVote = useGameStore((s) => s.openVote);
  const imposterGuessed = useGameStore((s) => s.imposterGuessed);

  const [remainingMs, setRemainingMs] = useState(5 * 60 * 1000);
  const subRound = current?.subRound ?? 1;

  // Reset timer on each sub-round
  useEffect(() => {
    setRemainingMs(5 * 60 * 1000);
    const interval = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [subRound]);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <p className="text-text-muted">Нема активна рунда.</p>
      </div>
    );
  }

  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const kickedNames = kickedOutIds.map((id) => playerMap.get(id) ?? '?');

  // First speaker for this round
  const firstSpeakerId = current.revealOrder[current.speakingIndex];
  const firstSpeakerName = playerMap.get(firstSpeakerId) ?? '?';

  return (
    <div className="animate-fade-in flex flex-col flex-1 gap-4 pt-2">
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

      {/* ── Круг chip ── */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/30 text-sm font-medium">
          ЗБОРУВАЊЕ · Круг {subRound} / {subRoundCap}
        </span>
      </div>

      {/* ── First-speaker card ── */}
      <div key={firstSpeakerId} className="animate-pop-in">
        <div className="bg-surface border border-accent/40 rounded-3xl p-5 text-center">
          <p className="text-text-dim uppercase tracking-wider text-xs mb-1">
            Прв зборува
          </p>
          <p className="text-3xl font-bold text-text">
            {firstSpeakerName}
          </p>
        </div>
      </div>

      {/* ── Timer ── */}
      <div className="text-center">
        {remainingMs > 0 ? (
          <span
            className={
              'text-6xl font-bold tabular-nums ' +
              (remainingMs <= 30_000
                ? 'animate-pulse-fast text-imposter'
                : 'text-text')
            }
          >
            {formatTime(remainingMs)}
          </span>
        ) : (
          <span className="text-lg text-text-muted">Времето истече</span>
        )}
      </div>

      {/* ── Kicked-out banner ── */}
      {kickedOutIds.length > 0 && (
        <div
          key={kickedOutIds.join(',')}
          className="animate-shake bg-tier-mid/10 border border-tier-mid/30 text-tier-mid rounded-2xl p-4 text-center"
        >
          <p className="text-sm font-medium">
            {kickedOutIds.length === 1
              ? `${kickedNames[0]} не беше ДУБАРА. Исфрлен е за остатокот од рундата.`
              : `${kickedNames.slice(0, -1).join(', ')} и ${kickedNames[kickedNames.length - 1]} не беа ДУБАРА. Исфрлени се за остатокот од рундата.`}
          </p>
        </div>
      )}

      {/* ── "Исфрлени" chip row ── */}
      {kickedOutIds.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {kickedOutIds.map((id) => (
            <span
              key={id}
              className="animate-shake inline-flex items-center px-3 py-1 rounded-full bg-tier-mid/10 text-tier-mid text-sm border border-tier-mid/20"
            >
              {playerMap.get(id) ?? '?'}
            </span>
          ))}
        </div>
      )}

      {/* ── Prompt ── */}
      <p className="text-2xl font-semibold text-center text-text">
        Играчите зборуваат…
      </p>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Vote button ── */}
      <Button variant="primary" size="lg" fullWidth onClick={openVote}>
        Гласајте
      </Button>
    </div>
  );
}
