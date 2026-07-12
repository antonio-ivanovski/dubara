import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Потврди',
  cancelLabel = 'Откажи',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 sm:p-5"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-sm p-5 sm:p-6 flex flex-col gap-4 safe-bottom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-text">{title}</h2>
        <p className="text-sm text-text-muted leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
