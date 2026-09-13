import { useState, useEffect } from 'react';
import { useCurrent, usePlayers } from '../store/selectors';
import { useGameStore } from '../store/gameStore';
import { WordCard } from './WordCard';
import { HINT_GLOSSARY } from '../game/hintGlossary';

export function RevealQueue() {
  const current = useCurrent();
  const players = usePlayers();
  const advanceReveal = useGameStore((s) => s.advanceReveal);

  const [showingWord, setShowingWord] = useState(false);

  const playerId = current?.revealOrder[current?.revealIndex ?? 0];
  const nextPlayer = players.find((p) => p.id === playerId);
  const nextPlayerName = nextPlayer?.name ?? '?';
  const total = current?.revealOrder.length ?? 0;
  const index = current?.revealIndex ?? 0;

  /* Reset the card to hidden whenever revealIndex advances (next player) */
  useEffect(() => {
    setShowingWord(false);
  }, [index]);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <p className="text-text-muted">Нема активна рунда.</p>
      </div>
    );
  }

  const isImposter = playerId === current.imposterId;
  const wordToShow = isImposter ? current.hintUsed : current.word.word;

  /* Knowers get the secret word's explanation; the imposter gets the
     hint's explanation when it exists (button hidden otherwise). */
  const explanation = isImposter
    ? (HINT_GLOSSARY[wordToShow] ?? null)
    : { definition: current.word.definition, example: current.word.example };

  const handleDismiss = () => {
    advanceReveal();
    setShowingWord(false);
  };

  if (showingWord) {
    return (
      <div className="animate-fade-in flex flex-col flex-1 pt-2">
        <WordCard
          word={wordToShow}
          isImposter={isImposter}
          explanation={explanation}
          onDismiss={handleDismiss}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 pt-2">
      {/* Subtle progress indicator */}
      <div className="text-center text-sm text-text-dim mb-4">
        Играч {index + 1} од {total}
      </div>

      {/* Tap target that reveals the WordCard */}
      <button
        onClick={() => setShowingWord(true)}
        className={
          'flex flex-col items-center justify-center flex-1 w-full min-h-[60svh] ' +
          'rounded-3xl bg-surface border border-border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] ' +
          'transition-colors active:scale-[0.98] touch-manipulation select-none ' +
          'cursor-pointer ' +
          'opacity-90 animate-pulse-fast'
        }
      >
        <p className="text-base text-text-muted mb-2">
          Предајте му го телефонот на
        </p>
        <p key={playerId} className="text-3xl font-bold text-text mb-4 animate-pop-in">
          {nextPlayerName}
        </p>
        <p className="text-sm text-text-dim">
          Кога ќе бидете подготвени, допрете го екранот.
        </p>
      </button>
    </div>
  );
}
