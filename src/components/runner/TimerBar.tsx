import Icon from '../ui/Icon';
import { formatDetik } from '@lib/timer';

export default function TimerBar({
  sisaDetik,
  budgetDetik,
  label = 'Sisa waktu',
  onPause,
  paused = false,
  blokLabel,
  sisaBlokDetik,
  compact = false,
}: {
  sisaDetik: number;
  budgetDetik: number;
  label?: string;
  onPause?: () => void;
  paused?: boolean;
  blokLabel?: string;
  sisaBlokDetik?: number;
  compact?: boolean;
}) {
  const persen = budgetDetik > 0 ? Math.max(0, Math.min(100, (sisaDetik / budgetDetik) * 100)) : 0;
  const kritis = sisaDetik <= 60;
  const hati = sisaDetik <= 300;

  return (
    <div class={`card ${compact ? 'py-3' : ''}`}>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-4">
          <div>
            <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p
              class={`text-3xl font-bold tabular-nums leading-none ${
                kritis ? 'text-rose-600' : hati ? 'text-amber-600' : 'text-slate-900'
              } ${paused ? 'opacity-50' : ''}`}
            >
              {formatDetik(sisaDetik)}
            </p>
          </div>

          {blokLabel && (
            <div class="border-l border-slate-200 pl-4">
              <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Blok</p>
              <p class="text-sm font-semibold text-slate-700">{blokLabel}</p>
              {typeof sisaBlokDetik === 'number' && (
                <p class="text-xs tabular-nums text-slate-500">sisa {formatDetik(sisaBlokDetik)}</p>
              )}
            </div>
          )}
        </div>

        <div class="flex items-center gap-2">
          {onPause && (
            <button
              type="button"
              onClick={onPause}
              class="btn-secondary"
              aria-label={paused ? 'Lanjutkan' : 'Jeda'}
            >
              <Icon name={paused ? 'play' : 'pause'} class="h-4 w-4" />
              {paused ? 'Lanjut' : 'Jeda'}
            </button>
          )}
        </div>
      </div>

      <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          class={`h-full rounded-full transition-all duration-500 ${
            kritis ? 'bg-rose-500' : hati ? 'bg-amber-400' : 'bg-tn-500'
          }`}
          style={{ width: `${persen}%` }}
        />
      </div>

      {kritis && !paused && (
        <p class="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
          <Icon name="alert" class="h-3.5 w-3.5" /> Waktu hampir habis — jawaban akan tersimpan otomatis.
        </p>
      )}
    </div>
  );
}
