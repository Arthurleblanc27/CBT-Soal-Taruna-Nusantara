import { useEffect } from 'preact/hooks';
import Icon from '../ui/Icon';

export type ToastVariant = 'info' | 'warning' | 'danger' | 'success';

const styles: Record<ToastVariant, string> = {
  info: 'border-tn-200 bg-tn-50 text-tn-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-rose-200 bg-rose-50 text-rose-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
};

const icons: Record<ToastVariant, 'alert' | 'check' | 'clock' | 'spark'> = {
  info: 'spark',
  warning: 'clock',
  danger: 'alert',
  success: 'check',
};

export default function CheckpointToast({
  pesan,
  variant = 'info',
  onTutup,
  autoMs = 6000,
  aksi,
}: {
  pesan: string;
  variant?: ToastVariant;
  onTutup: () => void;
  autoMs?: number;
  aksi?: { label: string; onClick: () => void };
}) {
  useEffect(() => {
    if (!autoMs) return;
    const t = setTimeout(onTutup, autoMs);
    return () => clearTimeout(t);
  }, [pesan, autoMs, onTutup]);

  return (
    <div class="no-print fixed left-1/2 top-16 z-40 w-[min(92vw,560px)] -translate-x-1/2">
      <div
        class={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${styles[variant]}`}
        role="status"
      >
        <Icon name={icons[variant]} class="mt-0.5 h-5 w-5 shrink-0" />
        <p class="flex-1 text-sm font-medium leading-snug">{pesan}</p>
        {aksi && (
          <button class="rounded-md bg-white/60 px-2.5 py-1 text-xs font-semibold hover:bg-white" onClick={aksi.onClick}>
            {aksi.label}
          </button>
        )}
        <button class="rounded p-1 hover:bg-white/50" onClick={onTutup} aria-label="Tutup">
          <Icon name="x" class="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
