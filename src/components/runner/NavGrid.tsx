import Icon from '../ui/Icon';

export type StatusNomor = 'kosong' | 'dijawab' | 'ragu' | 'benar' | 'salah' | 'aktif';

const styles: Record<StatusNomor, string> = {
  kosong: 'border-slate-200 bg-white text-slate-500 hover:border-slate-400',
  dijawab: 'border-tn-500 bg-tn-500 text-white',
  ragu: 'border-amber-400 bg-amber-300 text-amber-900',
  benar: 'border-emerald-500 bg-emerald-500 text-white',
  salah: 'border-rose-400 bg-rose-400 text-white',
  aktif: 'border-slate-900 bg-white text-slate-900 ring-2 ring-slate-900',
};

export default function NavGrid({
  total,
  indeks,
  status,
  onPilih,
  ragu,
  terjawab,
  judul = 'Navigasi soal',
}: {
  total: number;
  indeks: number;
  status: (i: number) => StatusNomor;
  onPilih: (i: number) => void;
  ragu: number;
  terjawab: number;
  judul?: string;
}) {
  return (
    <div class="card">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-800">{judul}</h2>
        <span class="text-xs tabular-nums text-slate-500">
          terjawab <strong class="font-semibold text-slate-700">{terjawab}</strong>/{total}
        </span>
      </div>

      <div class="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full bg-tn-500 transition-all"
          style={{ width: `${total ? (terjawab / total) * 100 : 0}%` }}
        />
      </div>

      <div class="grid max-h-[42vh] grid-cols-6 gap-1.5 overflow-y-auto pr-1">
        {Array.from({ length: total }, (_, i) => {
          const s = i === indeks ? 'aktif' : status(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPilih(i)}
              data-nav="true"
              aria-label={`Soal ${i + 1}`}
              aria-current={i === indeks ? 'true' : undefined}
              class={`flex h-8 items-center justify-center rounded-md border text-xs font-semibold tabular-nums transition ${styles[s]}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div class="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
        <Legenda cls="border-slate-300 bg-white" label="Belum dijawab" />
        <Legenda cls="border-tn-500 bg-tn-500" label="Sudah dijawab" />
        <Legenda cls="border-amber-400 bg-amber-300" label={`Ragu (${ragu})`} />
        <Legenda cls="border-slate-900 bg-slate-900" label="Soal aktif" />
      </div>
    </div>
  );
}

function Legenda({ cls, label }: { cls: string; label: string }) {
  return (
    <div class="flex items-center gap-2 text-slate-600">
      <span class={`inline-block h-3.5 w-3.5 rounded border ${cls}`} />
      {label}
    </div>
  );
}

export function NavRingkas({
  total,
  indeks,
  terjawab,
  ragu,
}: {
  total: number;
  indeks: number;
  terjawab: number;
  ragu: number;
}) {
  return (
    <div class="flex items-center gap-3 text-xs text-slate-500">
      <span class="inline-flex items-center gap-1">
        <Icon name="list" class="h-3.5 w-3.5" /> {indeks + 1}/{total}
      </span>
      <span class="inline-flex items-center gap-1">
        <Icon name="check" class="h-3.5 w-3.5" /> {terjawab}
      </span>
      <span class="inline-flex items-center gap-1">
        <Icon name="flag" class="h-3.5 w-3.5" /> {ragu}
      </span>
    </div>
  );
}
