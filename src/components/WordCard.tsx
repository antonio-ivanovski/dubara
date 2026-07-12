import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

interface WordCardProps {
  word: string;
  isImposter: boolean;
  onDismiss: () => void;
}

export function WordCard({ word, isImposter, onDismiss }: WordCardProps) {
  const [countdown, setCountdown] = useState(15);
  const onDismissRef = useRef(onDismiss);

  /* Keep the ref in sync so the timeout closure always calls the latest fn */
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      onDismissRef.current();
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className={
        'flex flex-col items-center justify-between w-full flex-1 ' +
        'rounded-2xl border-2 p-6 ' +
        (isImposter
          ? 'border-imposter bg-imposter-bg'
          : 'border-knower bg-knower-bg')
      }
    >
      {/* Countdown badge — top-right corner */}
      <div className="flex items-start w-full">
        <span className="ml-auto text-xs text-text-dim tabular-nums">
          {countdown}с
        </span>
      </div>

      {/* Label + word */}
      <div className="flex flex-col items-center gap-4 -mt-4">
        <span
          className={
            'text-sm font-medium ' +
            (isImposter ? 'text-imposter' : 'text-text-muted')
          }
        >
          {isImposter ? 'Ти си ДУБАРАта.' : 'Тајниот збор е:'}
        </span>
        <span className="text-[clamp(3.5rem,16vw,7rem)] leading-none font-bold text-text text-center break-words max-w-full">
          {word}
        </span>
      </div>

      {/* Dismiss button */}
      <div className="w-full">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onDismiss}
        >
          Следно
        </Button>
      </div>
    </div>
  );
}
