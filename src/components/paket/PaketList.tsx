import { useEffect, useState } from 'preact/hooks';
import type { Mapel } from '@data/schema';
import { MAPEL_META } from '@data/taxonomy';
import { loadPaket, type DokumenPaket, type Paket } from '@lib/paket';
import Icon from '../ui/Icon';

const URUT_MAPEL: Mapel[] = ['matematika', 'ipa', 'bindo', 'bing'];

const WARNA: Record<Mapel, string> = {
  matematika: 'bg-tn-500',
  ipa: 'bg-emerald-500',
  bindo: 'bg-amber-500',
  bing: 'bg-indigo-500',
};

export default function PaketList() {
  const [doc, setDoc] = useState<DokumenPaket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaket().then(({ doc, error }) => {
      setDoc(doc);
      setError(error ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16 text-center">
        <span class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-2 border-tn-500 border-t-transparent" />
        <p class="mt-3 text-sm text-slate-600">Memuat paket soal…</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16">
        <p class="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <Icon name="alert" class="mt-0.5 h-4 w-4 shrink-0" /> {error ?? 'Berkas paket tidak ditemukan.'}
        </p>
        <p class="mt-3 text-sm text-slate-600">
          Berkas yang dibaca: <code class="rounded bg-slate-100 px-1">public/paket/paket-tn-trainer.json</code>.
          Situs harus dibuka lewat server lokal (<code class="rounded bg-slate-100 px-1">start.bat</code>), bukan
          <code class="ml-1 rounded bg-slate-100 px-1">file://</code>.
        </p>
      </div>
    );
  }

  const totalNaskah = doc.paket.reduce((s, p) => s + p.jumlahNaskah, 0);
  const totalButir = doc.paket.reduce((s, p) => s + p.jumlah, 0);

  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <header class="mb-6">
        <a href="/" class="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
          <Icon name="left" class="h-3.5 w-3.5" /> Beranda
        </a>
        <h1 class="text-2xl font-bold text-slate-900">Tiga paket soal</h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600">
          {doc.jumlahPaket} paket terpisah · {doc.jumlahButirUnik} butir unik tanpa duplikat ·{' '}
          {totalNaskah} butir berasal dari naskah 2018 yang bisa dilacak. Setiap paket dijalankan sebagai sesi
          sendiri, jadi hasil dan waktunya tidak tercampur.
        </p>
      </header>

      <div class="grid gap-4 lg:grid-cols-3">
        {doc.paket.map((p, i) => (
          <KartuPaket key={p.id} paket={p} nomor={i + 1} />
        ))}
      </div>

      <section class="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-600">
        <p class="font-semibold text-slate-700">Sumber</p>
        <p class="mt-1">
          <strong>{totalNaskah} butir naskah</strong> · {doc.sumberUtama.naskah} ·{' '}
          <a class="font-medium text-tn-600 hover:underline" href={doc.sumberUtama.url} target="_blank" rel="noopener">
            buka dokumen
          </a>
        </p>
        <p class="mt-1">
          <strong>{totalButir - totalNaskah} butir prediksi</strong> · bukan soal panitia · {doc.sumberUtama.kisiKisi}
        </p>
        <p class="mt-2 text-slate-500">{doc.catatan}</p>
      </section>
    </div>
  );
}

function KartuPaket({ paket, nomor }: { paket: Paket; nomor: number }) {
  const maks = Math.max(...URUT_MAPEL.map((m) => paket.komposisi[m] ?? 0), 1);
  return (
    <article class="card flex flex-col">
      <div class="flex items-start justify-between gap-3">
        <div>
          <span class="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Paket {nomor}</span>
          <h2 class="mt-0.5 text-base font-bold leading-snug text-slate-900">{paket.nama.replace(/^Paket \d+ - /, '')}</h2>
        </div>
        <span class="shrink-0 rounded-full bg-tn-50 px-2 py-0.5 text-[0.65rem] font-semibold text-tn-700">
          {paket.jumlah} butir
        </span>
      </div>

      <p class="mt-2 min-h-[3.25rem] text-xs leading-relaxed text-slate-600">{paket.deskripsi}</p>

      <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-slate-50 px-2 py-1.5">
          <dt class="text-[0.6rem] uppercase tracking-wide text-slate-400">Waktu</dt>
          <dd class="text-sm font-bold tabular-nums text-slate-800">±{paket.targetMenit}m</dd>
        </div>
        <div class="rounded-lg bg-slate-50 px-2 py-1.5">
          <dt class="text-[0.6rem] uppercase tracking-wide text-slate-400">Naskah</dt>
          <dd class="text-sm font-bold tabular-nums text-slate-800">{paket.jumlahNaskah}</dd>
        </div>
        <div class="rounded-lg bg-slate-50 px-2 py-1.5">
          <dt class="text-[0.6rem] uppercase tracking-wide text-slate-400">Prediksi</dt>
          <dd class="text-sm font-bold tabular-nums text-slate-800">{paket.jumlahPrediksi}</dd>
        </div>
      </dl>

      <div class="mt-3 space-y-1.5">
        {URUT_MAPEL.map((m) => {
          const n = paket.komposisi[m] ?? 0;
          return (
            <div class="flex items-center gap-2 text-[0.7rem]">
              <span class="w-24 shrink-0 text-slate-500">{MAPEL_META[m].nama}</span>
              <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span class={`block h-full rounded-full ${WARNA[m]}`} style={{ width: `${(n / maks) * 100}%` }} />
              </span>
              <span class="w-4 text-right tabular-nums text-slate-500">{n}</span>
            </div>
          );
        })}
      </div>

      <a href={`/paket/${paket.id}`} class="btn-primary mt-4 w-full justify-center">
        <Icon name="play" class="h-4 w-4" /> Buka paket
      </a>
    </article>
  );
}
