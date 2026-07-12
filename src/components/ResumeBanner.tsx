import { useGameStore } from '../store/gameStore';
import { useIsResumable } from '../store/selectors';
import { Button } from './Button';

export function ResumeBanner() {
  const isResumable = useIsResumable();
  const resumeRound = useGameStore((s) => s.resumeRound);

  if (!isResumable) return null;

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-2xl flex items-center gap-3 px-4 py-3 mb-3">
      <span className="text-lg leading-none" aria-hidden="true">↩</span>
      <p className="flex-1 text-sm text-text">Имате незавршена рунда.</p>
      <Button variant="primary" size="md" onClick={resumeRound}>
        Врати се
      </Button>
    </div>
  );
}
