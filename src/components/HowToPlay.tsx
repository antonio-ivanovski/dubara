import { useState } from 'react';
import { Button } from './Button';

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

const SCREENS = [
  // 0: Intro
  {
    emoji: '🎲',
    emojiAnim: 'animate-pop-in',
    title: 'Што е ДУБАРА?',
    body:
      'ДУБАРА е игра со блефирање. Еден играч е ДУБАРАта, а сите други се знајци — го знаат тајниот збор. ДУБАРАта добива само поврзан збор и се обидува да не биде откриен.',
  },
  // 1: Pass the phone
  {
    emoji: '📱🤝',
    emojiAnim: 'animate-float',
    title: 'Тајно откријте го зборот',
    body:
      'Телефонот се предава од играч до играч. Секој го гледа тајниот збор, освен ДУБАРАта — тој гледа само поврзан збор.',
  },
  // 2: Speak
  {
    emoji: '💬',
    emojiAnim: 'animate-wiggle',
    title: 'Кажувајте поврзани зборови',
    body:
      'По ред, секој кажува по еден збор поврзан со тајниот збор. Кажувајте нешто доволно јасно за знајците, но не премногу очигледно за ДУБАРАта. Во секој круг користете нов збор.',
  },
  // 3: Vote
  {
    emoji: '👆🗳️',
    emojiAnim: 'animate-pulse-fast',
    title: 'Гласајте за ДУБАРАта',
    body:
      'Кога сите ќе кажат збор, разговарајте и изберете кого го сомничите. Допрете го името на играчот за кого мислите дека е ДУБАРАта.',
  },
  // 4: Reveal
  {
    emoji: '🎭',
    emojiAnim: 'animate-spin-slow',
    title: 'Што ако погрешите?',
    body:
      'Ако избраниот играч не е ДУБАРАта, тој излегува од рундата и не може повторно да зборува или да биде избран. Потоа продолжувате со следниот круг.',
  },
  // 5: Worked example
  {
    emoji: '✨',
    emojiAnim: 'animate-spin-slow',
    title: 'Како завршува рундата?',
    body:
      'Ако го изберете играчот што е ДУБАРАта, знајците победуваат. Ако ДУБАРАта го каже точниот збор или преживее до последниот круг, тој победува. На пример: за „мачка“, знајците можат да кажат „мјаука“, а ДУБАРАта, кој го добил „животно“, мора да се вклопи без да го открие вистинскиот збор.',
  },
  // 6: Scoring
  {
    emoji: '🏆',
    emojiAnim: 'animate-pop-in',
    title: 'Како се добиваат поени?',
    body: (
      <div className="w-full max-w-sm space-y-2 text-left">
        <ScoreRow label="ДУБАРАТА го погодува зборот" value="+5" />
        <ScoreRow label="ДУБАРАТА преживува до крај" value="+7" />
        <div className="border-t border-border my-3" />
        <ScoreRow label="Знајците ја фаќаат веднаш" value="+3 секој" />
        <ScoreRow label="Ја фаќаат во вториот круг" value="+2 секој" />
        <ScoreRow label="Ја фаќаат во третиот или подоцна" value="+1 секој" />
        <ScoreRow label="Погрешно исфрлен играч" value="0" />
        <p className="text-xs text-text-dim text-center pt-2 leading-relaxed">
          Ако ДУБАРАТА биде фатена, таа добива 0 поени во првиот круг, 1 во
          вториот или третиот, и 2 во четвртиот или петтиот круг.
        </p>
      </div>
    ),
   },
  {
    emoji: '🕵️',
    emojiAnim: 'animate-wiggle',
    title: 'Совет за добра игра',
    body:
      'Не повторувајте исти зборови и не кажувајте премногу очигледни траги. Знајците треба да се разберат меѓусебно, а ДУБАРАта да има шанса да се сокрие.',
  },
];

function ScoreRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5 border border-border">
      <span className="text-sm text-text-muted">{label}</span>
      <strong className="shrink-0 text-sm text-text tabular-nums">{value}</strong>
    </div>
  );
}

export function HowToPlay({ open, onClose }: HowToPlayProps) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const isFirst = step === 0;
  const isLast = step === SCREENS.length - 1;
  const current = SCREENS[step];

  return (
    <div
      className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto px-4 py-6 min-h-screen flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text">Како се игра?</h1>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 min-h-12 flex items-center justify-center rounded-full text-text-dim hover:text-text hover:bg-surface transition-colors touch-manipulation"
            aria-label="Затвори"
          >
            ✕
          </button>
        </div>

        {/* ── Step card ── */}
        <div key={step} className="animate-pop-in flex flex-col items-center flex-1 justify-center">
          <div className={'text-8xl text-center ' + current.emojiAnim}>
            {current.emoji}
          </div>
          <h2 className="text-2xl font-bold text-text text-center mt-4">
            {current.title}
          </h2>
          <div className="text-text-muted text-center mt-2 leading-relaxed max-w-sm">
            {current.body}
          </div>
        </div>

        {/* ── Stepper dots ── */}
        <div className="flex justify-center gap-2 mt-6">
          {SCREENS.map((_, i) => (
            <span
              key={i}
              className={
                'h-2 rounded-full transition-all duration-300 ' +
                (i === step ? 'w-8 bg-accent' : 'w-2 bg-border')
              }
            />
          ))}
        </div>

        {/* ── Navigation ── */}
        <div className="flex gap-3 mt-auto pt-6">
          {!isFirst && (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setStep((s) => s - 1)}
            >
              Назад
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
          >
            {isFirst ? 'Започни' : isLast ? 'Готово' : 'Следно'}
          </Button>
        </div>
      </div>
    </div>
  );
}
