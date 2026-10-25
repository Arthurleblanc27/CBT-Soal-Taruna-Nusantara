import type { Item } from '@data/schema';
import Icon from '../ui/Icon';
import RichText from '../media/RichText';

export default function ExplainPanel({
  item,
  jawaban,
  onUlangi,
  onLanjut,
  selesai,
}: {
  item: Item;
  jawaban: string | null;
  onUlangi?: () => void;
  onLanjut?: () => void;
  selesai?: boolean;
}) {
  const benar = jawaban === item.kunci;

  return (
    <section class="mt-4 space-y-3" aria-live="polite">
      <div
        class={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
          benar ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
        }`}
      >
        <div class="flex items-center gap-2">
          <span
            class={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-white ${
              benar ? 'bg-emerald-600' : 'bg-rose-500'
            }`}
          >
            <Icon name={benar ? 'check' : 'x'} class="h-4 w-4" />
          </span>
          <div>
            <p class={`text-sm font-semibold ${benar ? 'text-emerald-800' : 'text-rose-800'}`}>
              {benar ? 'Jawaban benar' : jawaban ? 'Jawaban kurang tepat' : 'Belum dijawab'}
            </p>
            <p class="text-xs text-slate-600">
              Kunci: <strong>{item.kunci}</strong>
              {!benar && jawaban ? ` · jawabanmu: ${jawaban}` : ''}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          {onUlangi && !benar && (
            <button class="btn-secondary" onClick={onUlangi}>
              <Icon name="refresh" class="h-4 w-4" /> Coba lagi
            </button>
          )}
          {onLanjut && (
            <button class="btn-primary" onClick={onLanjut}>
              {selesai ? 'Lihat ringkasan' : 'Soal berikutnya'} <Icon name="right" class="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div class="card space-y-4">
        <div>
          <h3 class="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-800">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded bg-tn-600 text-[0.65rem] text-white">1</span>
            Inti
          </h3>
          <div class="text-sm leading-relaxed text-slate-700">
            <RichText text={item.pembahasan.inti} />
          </div>
        </div>

        <div>
          <h3 class="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-800">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded bg-tn-600 text-[0.65rem] text-white">2</span>
            Langkah
          </h3>
          <ol class="space-y-2">
            {item.pembahasan.langkah.map((l, i) => (
              <li class="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[0.65rem] font-semibold text-slate-600">
                  {i + 1}
                </span>
                <RichText text={l} class="flex-1" />
              </li>
            ))}
          </ol>
        </div>

        <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 class="mb-1 flex items-center gap-2 text-sm font-bold text-amber-900">
            <Icon name="alert" class="h-4 w-4" /> Jebakan
          </h3>
          <div class="text-sm leading-relaxed text-amber-900/90">
            <RichText text={item.pembahasan.jebakan} />
          </div>
        </div>

        {item.pembahasan.cepat && (
          <div class="rounded-lg border border-tn-200 bg-tn-50 px-4 py-3">
            <h3 class="mb-1 flex items-center gap-2 text-sm font-bold text-tn-900">
              <Icon name="zap" class="h-4 w-4" /> Trik cepat
            </h3>
            <div class="text-sm leading-relaxed text-tn-900/90">
              <RichText text={item.pembahasan.cepat} />
            </div>
          </div>
        )}

        <p class="border-t border-slate-100 pt-3 text-xs text-slate-500">
          {item.asal === 'naskah'
            ? `Sumber naskah ${item.tahun ?? ''} · ${item.sumber ?? '—'}`
            : item.asal === 'rekonstruksi'
              ? `Rekonstruksi peserta ${item.tahun ?? ''} · ${item.sumber ?? '—'}`
              : 'Prediksi HOTS · disusun mengikuti kisi-kisi 27 kategori'}
        </p>
      </div>
    </section>
  );
}
