import type { Item } from '@data/schema';
import { KATEGORI_BY_SLUG } from '@data/taxonomy';
import Icon from '../ui/Icon';
import Figure from '../media/Figure';
import RichText from '../media/RichText';

export type KodeJawaban = 'A' | 'B' | 'C' | 'D' | 'E';

const HURUF: KodeJawaban[] = ['A', 'B', 'C', 'D', 'E'];

export default function QuestionCard({
  item,
  nomor,
  total,
  jawaban,
  onPilih,
  revealed = false,
  ragu = false,
  onRagu,
  disabled = false,
  waktuButir,
}: {
  item: Item;
  nomor: number;
  total: number;
  jawaban: KodeJawaban | null;
  onPilih: (kode: KodeJawaban) => void;
  revealed?: boolean;
  ragu?: boolean;
  onRagu?: () => void;
  disabled?: boolean;
  waktuButir?: number;
}) {
  const kat = KATEGORI_BY_SLUG.get(item.kategori);

  return (
    <article class="card">
      <header class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="rounded-md bg-tn-50 px-2 py-1 font-semibold text-tn-700">
            Soal {nomor} / {total}
          </span>
          <span class="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{kat?.nama ?? item.kategori}</span>
          <span class="rounded-md bg-slate-100 px-2 py-1 capitalize text-slate-600">{item.tingkat}</span>
          <span class="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{item.kognitif}</span>
          {item.asal !== 'naskah' && (
            <span class="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
              {item.asal === 'prediksi' ? 'prediksi HOTS' : 'rekonstruksi'}
            </span>
          )}
        </div>
        <div class="flex items-center gap-2">
          {typeof waktuButir === 'number' && (
            <span class="inline-flex items-center gap-1 text-xs tabular-nums text-slate-400">
              <Icon name="clock" class="h-3.5 w-3.5" />
              {(waktuButir / 1000).toFixed(1)}s
            </span>
          )}
          {onRagu && (
            <button
              type="button"
              onClick={onRagu}
              class={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                ragu ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Icon name="flag" class="h-3.5 w-3.5" />
              {ragu ? 'Ditandai' : 'Ragu'} <kbd class="ml-1 hidden sm:inline">F</kbd>
            </button>
          )}
        </div>
      </header>

      {item.stimulus?.teks && (
        <div class="mb-3 rounded-lg border-l-4 border-tn-200 bg-slate-50 px-4 py-3 text-[0.95rem] leading-relaxed text-slate-700">
          <RichText text={item.stimulus.teks} />
        </div>
      )}

      {item.stimulus?.gambar && (
        <Figure src={item.stimulus.gambar} alt={item.stimulus.alt || 'Gambar stimulus'} />
      )}

      <div class="prose-p:text-justify mb-4 max-w-prose text-[1.02rem] leading-relaxed text-slate-900">
        <RichText text={item.soal} />
      </div>

      <div class="grid gap-2.5" role="radiogroup" aria-label="Pilihan jawaban">
        {item.pilihan.map((p) => {
          const dipilih = jawaban === p.kode;
          const benar = revealed && p.kode === item.kunci;
          const salah = revealed && dipilih && p.kode !== item.kunci;

          let cls = 'border-slate-200 bg-white hover:border-tn-300 hover:bg-tn-50/40';
          if (dipilih && !revealed) cls = 'border-tn-500 bg-tn-50 ring-1 ring-tn-500';
          if (benar) cls = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
          if (salah) cls = 'border-rose-400 bg-rose-50 ring-1 ring-rose-400';
          if (revealed && !benar && !salah) cls = 'border-slate-200 bg-white opacity-70';

          return (
            <button
              key={p.kode}
              type="button"
              role="radio"
              aria-checked={dipilih}
              disabled={disabled}
              onClick={() => onPilih(p.kode)}
              class={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-default ${cls}`}
            >
              <span
                class={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  benar
                    ? 'bg-emerald-600 text-white'
                    : salah
                      ? 'bg-rose-500 text-white'
                      : dipilih
                        ? 'bg-tn-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {benar ? <Icon name="check" class="h-4 w-4" /> : salah ? <Icon name="x" class="h-4 w-4" /> : p.kode}
              </span>
              <span class="flex-1 text-[0.98rem] leading-relaxed text-slate-800">
                <RichText text={p.teks} />
              </span>
              <span class={`mt-1 hidden shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide lg:inline ${dipilih ? 'text-tn-600' : 'text-slate-300'}`}>
                {dipilih ? 'dipilih' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <footer class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>
          Target pace{kat ? ` ${kat.nama.split(':')[0]}` : ''}:{' '}
          <strong class="tabular-nums text-slate-700">{item.targetDetik} dtk</strong>
        </span>
        <span class="hidden items-center gap-2 lg:flex">
          <kbd>A</kbd>–<kbd>E</kbd> pilih · <kbd>←</kbd><kbd>→</kbd> pindah · <kbd>Enter</kbd> lanjut
        </span>
      </footer>
    </article>
  );
}
