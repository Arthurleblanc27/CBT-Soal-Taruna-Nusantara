import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Item, Mapel } from '@data/schema';
import { MAPEL_META } from '@data/taxonomy';
import { createSesi, type Sesi } from '@lib/session';
import { bacaSesiAktif, hapusSesiAktif } from '@lib/sessionStore';
import { finalisasiKedaluwarsa, sesiMilikPaket } from '@lib/recovery';
import { loadPaket, cariPaket, butirPaket, type DokumenPaket, type Paket } from '@lib/paket';
import ExamRunner from '../runner/ExamRunner';
import Icon from '../ui/Icon';

const URUT_MAPEL: Mapel[] = ['matematika', 'ipa', 'bindo', 'bing'];

export default function PaketRunner({ paketId }: { paketId: string }) {
  const [doc, setDoc] = useState<DokumenPaket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [sesiLama, setSesiLama] = useState<Sesi | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const kedaluwarsa = finalisasiKedaluwarsa();
    if (kedaluwarsa) {
      window.location.href = `/hasil?id=${kedaluwarsa.id}`;
      return;
    }
    loadPaket().then(({ doc, error }) => {
      setDoc(doc);
      setError(error ?? null);
      setLoading(false);
    });
  }, []);

  const paket = useMemo(() => cariPaket(doc, paketId), [doc, paketId]);

  // Sesi yang masih berjalan untuk paket ini ditawarkan untuk dilanjutkan.
  useEffect(() => {
    if (!paket) return;
    const tersimpan = bacaSesiAktif();
    setSesiLama(tersimpan && sesiMilikPaket(tersimpan.daftarItem, paket.ids) ? tersimpan : null);
  }, [paket]);

  if (loading) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16 text-center">
        <span class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-2 border-tn-500 border-t-transparent" />
        <p class="mt-3 text-sm text-slate-600">Memuat paket…</p>
      </div>
    );
  }

  if (error || !paket) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16">
        <p class="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <Icon name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
          {error ?? `Paket "${paketId}" tidak ada di berkas paket.`}
        </p>
        <a href="/paket" class="btn-secondary mt-4 inline-flex">
          <Icon name="left" class="h-4 w-4" /> Daftar paket
        </a>
      </div>
    );
  }

  if (sesi) {
    return (
      <ExamRunner
        mode={sesi.mode}
        items={items}
        sesiAwal={sesi}
        bankVersi={sesi.bankVersi}
        judul={paket.nama}
      />
    );
  }

  const mulai = (denganTimer: boolean) => {
    const daftar = butirPaket(paket);
    if (!daftar.length) return;
    setItems(daftar);
    // Kedua tombol memakai mode ujian (simulasi). Tanpa timer berarti budgetDetik 0:
    // tidak ada countdown dan tidak ada umpan balik per butir — hasil muncul di akhir.
    setSesi(
      createSesi({
        mode: 'simulasi',
        daftarItem: daftar.map((i) => i.id),
        bankVersi: paket.bankVersi,
        budgetDetik: denganTimer ? paket.targetMenit * 60 : 0,
        blokMapel: [],
      })
    );
  };

  const naskah = paket.daftarSumber.filter((s) => s.asal === 'naskah');

  return (
    <div class="mx-auto max-w-5xl px-4 py-6">
      <header class="mb-5">
        <a href="/paket" class="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
          <Icon name="left" class="h-3.5 w-3.5" /> Semua paket
        </a>
        <h1 class="text-2xl font-bold text-slate-900">{paket.nama}</h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600">{paket.deskripsi}</p>
      </header>

      {sesiLama && (
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div class="flex items-start gap-2 text-sm text-amber-900">
            <Icon name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p class="font-semibold">Paket ini sedang dikerjakan.</p>
              <p class="text-xs text-amber-800">
                {Object.values(sesiLama.jawaban).filter(Boolean).length} dari {sesiLama.daftarItem.length} butir terjawab ·
                sisa {Math.max(0, Math.round(sesiLama.budgetDetik - (Date.now() - sesiLama.mulai) / 1000))} detik ·
                jawaban tersimpan di perangkat ini.
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="btn-secondary btn-sm"
              onClick={() => {
                hapusSesiAktif();
                setSesiLama(null);
              }}
            >
              Buang
            </button>
            <button
              class="btn-primary btn-sm"
              onClick={() => {
                setItems(butirPaket(paket));
                setSesi(sesiLama);
                setSesiLama(null);
              }}
            >
              Lanjutkan sesi
            </button>
          </div>
        </div>
      )}

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="space-y-4">
          <div class="card">
            <h2 class="mb-3 text-sm font-bold text-slate-800">Komposisi paket</h2>
            <table class="w-full text-left text-sm">
              <thead class="text-xs text-slate-400">
                <tr class="border-b border-slate-100">
                  <th class="pb-2 font-semibold">Mapel</th>
                  <th class="pb-2 text-right font-semibold">Butir</th>
                  <th class="pb-2 text-right font-semibold">Pace</th>
                </tr>
              </thead>
              <tbody>
                {URUT_MAPEL.filter((m) => (paket.komposisi[m] ?? 0) > 0).map((m) => (
                  <tr class="border-b border-slate-50 text-slate-700">
                    <td class="py-2 font-medium">{MAPEL_META[m].nama}</td>
                    <td class="py-2 text-right tabular-nums">{paket.komposisi[m]}</td>
                    <td class="py-2 text-right tabular-nums text-slate-500">{MAPEL_META[m].targetDetik} dtk</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p class="mt-3 text-xs text-slate-500">
              {paket.jumlah} butir · {paket.jumlahNaskah} dari naskah 2018 · {paket.jumlahPrediksi} prediksi · target{' '}
              {paket.targetMenit} menit.
            </p>
          </div>

          <div class="card">
            <h2 class="mb-2 text-sm font-bold text-slate-800">Sumber butir</h2>
            <p class="mb-3 text-xs text-slate-500">
              Setiap butir menyimpan asal dan tahun. Butir naskah memakai nomor asli pada dokumen 2018.
            </p>
            <ul class="space-y-1.5 text-xs">
              {paket.daftarSumber.map((s) => (
                <li class="flex items-start gap-2">
                  <span
                    class={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase ${
                      s.asal === 'naskah' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.asal}
                  </span>
                  <span class="text-slate-600">
                    <code class="text-slate-800">{s.id}</code>
                    {s.tahun ? ` · ${s.tahun}` : ''} — {s.sumber}
                  </span>
                </li>
              ))}
            </ul>
            {naskah.length > 0 && doc && (
              <p class="mt-3 text-xs text-slate-500">
                Dokumen naskah:{' '}
                <a class="font-medium text-tn-600 hover:underline" href={doc.sumberUtama.url} target="_blank" rel="noopener">
                  {doc.sumberUtama.naskah}
                </a>
              </p>
            )}
          </div>
        </div>

        <aside class="space-y-3">
          <div class="card">
            <h2 class="mb-2 text-sm font-bold text-slate-800">Mulai</h2>
            <p class="mb-3 text-xs text-slate-600">
              Kedua pilihan bersifat ujian: tidak ada kunci atau pembahasan sebelum selesai. Dengan timer,
              {' '}{paket.targetMenit} menit untuk {paket.jumlah} butir. Tanpa timer, waktu tidak dibatasi. Skor dan
              koreksi muncul otomatis setelah butir terakhir dijawab.
            </p>
            <button class="btn-primary w-full justify-center" onClick={() => mulai(true)}>
              <Icon name="clock" class="h-4 w-4" /> Mulai dengan timer
            </button>
            <button class="btn-secondary mt-2 w-full justify-center" onClick={() => mulai(false)}>
              <Icon name="book" class="h-4 w-4" /> Latihan tanpa timer
            </button>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p class="mb-1 font-semibold text-slate-700">Pintasan keyboard</p>
            <p>
              <kbd>A</kbd>–<kbd>E</kbd> jawab · <kbd>←</kbd>
              <kbd>→</kbd> pindah · <kbd>F</kbd> ragu · <kbd>Esc</kbd> keluar
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
