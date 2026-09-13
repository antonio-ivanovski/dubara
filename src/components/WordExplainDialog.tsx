import { Button } from './Button';

interface WordExplainDialogProps {
  open: boolean;
  word: string;
  definition: string;
  example: string;
  onClose: () => void;
}

export function WordExplainDialog({
  open,
  word,
  definition,
  example,
  onClose,
}: WordExplainDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 sm:p-5"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-sm p-5 sm:p-6 flex flex-col gap-4 safe-bottom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="explain-dialog-title" className="text-lg font-semibold text-text break-words [overflow-wrap:anywhere]">
          Што значи „{word}“?
        </h2>
        <p className="text-sm text-text leading-relaxed break-words [overflow-wrap:anywhere]">{definition}</p>
        <div className="rounded-xl bg-surface-2 border border-border p-3 min-w-0">
          <p className="text-xs text-text-dim uppercase tracking-wider mb-1">
            Пример
          </p>
          <p className="text-sm text-text-muted italic leading-relaxed break-words [overflow-wrap:anywhere]">{example}</p>
        </div>
        <div className="mt-1">
          <Button variant="primary" fullWidth onClick={onClose}>
            Разбрав
          </Button>
        </div>
      </div>
    </div>
  );
}
