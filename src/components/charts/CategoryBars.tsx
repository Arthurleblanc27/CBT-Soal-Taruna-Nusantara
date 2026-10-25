import { statusKekuatan } from '@lib/scoring';

export interface BarData {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  hint?: string;
  slug?: string;
}

export default function CategoryBars({
  data,
  judul,
  mode = 'persen',
  ambang = true,
}: {
  data: BarData[];
  judul?: string;
  mode?: 'persen' | 'detik';
  ambang?: boolean;
}) {
  if (!data.length) {
    return (
      <div class="card text-center text-sm text-slate-500">
        Belum ada data. Kerjakan satu sesi untuk mengisi grafik ini.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.max ?? d.value), mode === 'persen' ? 100 : 1);

  return (
    <div class="card">
      {judul && <h3 class="mb-3 text-sm font-bold text-slate-800">{judul}</h3>}
      <ul class="space-y-2.5">
        {data.map((d) => {
          const pct = Math.min(100, (d.value / max) * 100);
          const warna =
            mode === 'persen' && ambang
              ? d.value >= 85
                ? 'bg-emerald-500'
                : d.value >= 60
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              : 'bg-tn-500';
          const status = mode === 'persen' ? statusKekuatan(d.value) : null;
          return (
            <li key={d.label}>
              <div class="mb-1 flex items-baseline justify-between gap-2">
                <span class="truncate text-xs font-medium text-slate-700">{d.label}</span>
                <span class="flex items-center gap-2 text-xs tabular-nums text-slate-500">
                  {d.hint && <span class="hidden sm:inline">{d.hint}</span>}
                  <strong class="text-slate-800">
                    {mode === 'persen' ? `${d.value}%` : `${d.value} dtk`}
                  </strong>
                  {status && (
                    <span class={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  )}
                </span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div class={`h-full rounded-full ${warna}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
