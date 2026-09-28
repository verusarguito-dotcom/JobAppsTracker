import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    info: 'bg-sky-50 border-sky-200 text-sky-900',
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  const iconColor = {
    success: 'text-emerald-600',
    error: 'text-rose-600',
    info: 'text-sky-600',
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border shadow-lg text-body-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${bgStyles}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 whitespace-pre-line break-words text-body-sm leading-snug">
        {toast.message}
      </div>
      <button
        onClick={onDismiss}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 text-ink-muted hover:text-ink transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
