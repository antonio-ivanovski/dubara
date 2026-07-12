import { Logo } from './Logo';
import { useHistory, useScores, usePlayers } from '../store/selectors';

interface HeaderProps {
  rightSlot?: React.ReactNode;
  onOpenScoreboard?: () => void;
  showLogo?: boolean;
}

export function Header({ rightSlot, onOpenScoreboard, showLogo = true }: HeaderProps) {
  const history = useHistory();
  const scores = useScores();
  const players = usePlayers();
  const inTournament = history.length > 0 || Object.keys(scores).length > 0;
  const playerCount = players.length;

  return (
    <header className="w-full py-2 sm:py-3">
      <div className="flex items-center justify-between gap-3 min-h-12">
        {showLogo ? <Logo size="sm" /> : <span aria-hidden="true" />}
        {onOpenScoreboard && (
          <button
            onClick={onOpenScoreboard}
            className="min-h-12 min-w-12 rounded-xl bg-surface border border-border text-base hover:bg-surface-2 active:scale-[0.98]"
            aria-label="Резултати"
          >
            📊
          </button>
        )}
        {rightSlot}
      </div>
      {inTournament && (
        <div className="text-left text-xs text-text-dim mt-1">
          {playerCount} {playerCount === 1 ? 'играч' : 'играчи'} ·{' '}
          {history.length} {history.length === 1 ? 'рунда' : 'рунди'}
        </div>
      )}
    </header>
  );
}
