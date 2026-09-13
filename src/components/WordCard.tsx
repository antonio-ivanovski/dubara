import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { WordExplainDialog } from './WordExplainDialog';

interface WordExplanation {
  definition: string;
  example: string;
}

interface WordCardProps {
  word: string;
  isImposter: boolean;
  explanation: WordExplanation | null;
  onDismiss: () => void;
}

const TOTAL_MS = 15000;

export function WordCard({ word, isImposter, explanation, onDismiss }: WordCardProps) {
  const [countdown, setCountdown] = useState(15);
  const [explainOpen, setExplainOpen] = useState(false);
  const onDismissRef = useRef(onDismiss);

  /* Remaining time survives pause while the explanation dialog is open */
  const remainingRef = useRef(TOTAL_MS);
  const deadlineRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  /* Keep the ref in sync so the timeout closure always calls the latest fn */
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  /* Single timer effect: runs on mount and every time the dialog opens/closes.
     Opening the dialog pauses (records remaining, clears timers);
     closing resumes with the remaining time. Cleanup clears timers. */
  useEffect(() => {
    if (explainOpen) {
      remainingRef.current = Math.max(0, deadlineRef.current - Date.now());
      return;
    }
    deadlineRef.current = Date.now() + remainingRef.current;
    timeoutRef.current = window.setTimeout(() => {
      onDismissRef.current();
    }, remainingRef.current);
    intervalRef.current = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }, 250);
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [explainOpen]);

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
      <div className="flex flex-col items-center gap-4 -mt-4 w-full min-w-0">
        <span
          className={
            'text-sm font-medium ' +
            (isImposter ? 'text-imposter' : 'text-text-muted')
          }
        >
          {isImposter ? 'Ти си ДУБАРАта.' : 'Тајниот збор е:'}
        </span>
        <span className="text-[clamp(3.5rem,16vw,7rem)] leading-none font-bold text-text text-center break-all [overflow-wrap:anywhere] whitespace-normal min-w-0 w-full max-w-full">
          {word}
        </span>
      </div>

      {/* Explanation + dismiss buttons */}
      <div className="w-full flex flex-col gap-2">
        {explanation && (
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => setExplainOpen(true)}
          >
            Што значи овој збор?
          </Button>
        )}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onDismiss}
        >
          Следно
        </Button>
      </div>

      {explanation && (
        <WordExplainDialog
          open={explainOpen}
          word={word}
          definition={explanation.definition}
          example={explanation.example}
          onClose={() => setExplainOpen(false)}
        />
      )}
    </div>
  );
}
