import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Item, Mapel } from '@data/schema';
import { KATEGORI_BY_SLUG, MAPEL_META } from '@data/taxonomy';
import { ambilHasil, daftarHasilId } from '@lib/analytics';
import { loadBank, type LoadedBank } from '@lib/bank';
import type { SesiResult } from '@lib/session';
import { hitungSkor, statusKekuatan } from '@lib/scoring';
import { metrikKecepatan, skorKecepatan } from '@lib/speed';
import { formatMenitDetik } from '@lib/timer';
import CategoryBars, { type BarData } from '../charts/CategoryBars';
import ExplainPanel from '../learn/ExplainPanel';
import RichText from '../media/RichText';
import Icon from '../ui/Icon';

export default function HasilView() {
  const [hasil, setHasil] = useState<SesiResult | null>(null);
  const [bank, setBank] = useState<LoadedBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [buka, setBuka] = useState<string | null>(null);
  // Default: tampilkan semua butir beserta kunci, supaya koreksi terlihat di akhir sesi.
  const [hanyaSalah, setHanyaSalah] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    const r = id ? ambilHasil(id) : null;
    if (!r) {
      setLoading(false);
      return;
    }
    setHasil(r);
    loadBank().then((res) => {
      setBank(res.bank);
      setLoading(false);
    });
  }, []);

  const items = useMemo(
    () => (hasil ? (hasil.daftarItem.map((id) => bank?.byId.get(id)).filter(Boolean) as Item[]) : []),
    [hasil, bank]
  );

  const skor = useMemo(() => (items.length ? hitungSkor(hasil!.jawaban, items) : null), [items, hasil]);

  const durasi = useMemo(() => {
    if (!hasil) return [];
    return Object.values(hasil.durasiButir).filter((d) => d > 800 && d < 600_000);
  }, [hasil]);

  const targetRata = items.length
    ? Math.round(items.reduce((s, i) => s + i.targetDetik, 0) / items.length)
    : 60;
  const metrik = metrikKecepatan(durasi, targetRata);
  const kecepatanSkor = skor ? skorKecepatan(skor.skor, metrik.persenTepatWaktu) : 0;

  const barsKategori: BarData[] = useMemo(() => {
    if (!skor) return [];
    return Object.entries(skor.akurasiKategori)
      .map(([slug, a]) => ({
        label: KATEGORI_BY_SLUG.get(slug)?.nama ?? slug,
        value: a.persen,
        hint: `${a.benar}/${a.total}`,
      }))
      .sort((a, b) => a.value - b.value);
  }, [skor]);

  const barsKecepatan: BarData[] = useMemo(() => {
    if (!hasil || !bank) return [];
    const grup: Record<string, number[]> = {};
    for (const [id, ms] of Object.entries(hasil.durasiButir)) {
      const it = bank.byId.get(id);
      if (!it || ms < 800) continue;
      (grup[it.kategori] ||= []).push(ms);
    }
    const rows = Object.entries(grup).map(([slug, arr]) => {
      const kat = KATEGORI_BY_SLUG.get(slug);
      const m = metrikKecepatan(arr, kat?.targetDetik ?? 60);
      return {
        label: kat?.nama ?? slug,
        value: m.medianDetik,
        hint: `target ${kat?.targetDetik ?? 60}s · ${Math.round(m.persenTepatWaktu * 100)}% tepat`,
      };
    });
    const max = Math.max(...rows.map((r) => r.value), 1);
    return rows.map((r) => ({ ...r, max })).sort((a, b) => b.value - a.value);
  }, [hasil, bank]);

  if (loading) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16 text-center">
        <span class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-2 border-tn-500 border-t-transparent" />
        <p class="mt-3 text-sm text-slate-600">Menghitung hasil…</p>
      </div>
    );
  }

  if (!hasil || !skor) {
    return (
      <div class="container-narrow py-12">
        <div class="empty">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon name="chart" class="h-6 w-6" />
          </span>
          <h1 class="mt-1 text-lg font-bold text-slate-800">Belum ada hasil untuk ditampilkan</h1>
          <p class="max-w-md text-sm leading-relaxed text-slate-500">
            Hasil muncul otomatis setelah satu sesi selesai. Mulai dari paket terpendek (±8 menit), atau buka
            analitik untuk melihat riwayat yang sudah tersimpan di perangkat ini.
          </p>
          <div class="mt-3 flex flex-wrap justify-center gap-2">
            <a href="/paket/paket-1" class="btn-primary">
              <Icon name="play" class="h-4 w-4" /> Kerjakan Paket 1
            </a>
            <a href="/analitik" class="btn-secondary">
              <Icon name="chart" class="h-4 w-4" /> Buka analitik
            </a>
          </div>
          <p class="mt-2 text-[0.7rem] text-slate-400">
            Data tersimpan lokal di peramban ini; menghapus data situs akan menghapus riwayat.
          </p>
        </div>
      </div>
    );
  }

  const lulus = skor.skor >= 70;

  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
        <a href="/" class="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
          <Icon name="left" class="h-3.5 w-3.5" /> Beranda
        </a>
        <div class="flex gap-2">
          <button class="btn-secondary" onClick={() => window.print()}>
            <Icon name="download" class="h-4 w-4" /> Cetak
          </button>
          <a class="btn-secondary" href={`/analitik`}>
            <Icon name="chart" class="h-4 w-4" /> Analitik
          </a>
          <a class="btn-primary" href={hasil.mode === 'simulasi' ? '/simulasi' : `/belajar/matematika`}>
            <Icon name="refresh" class="h-4 w-4" /> Sesi baru
          </a>
        </div>
      </div>

      {/* Skor utama */}
      <section class="card mb-4 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Hasil{' '}
              {hasil.mode === 'simulasi'
                ? hasil.format === 'padat-105'
                  ? 'simulasi padat 105'
                  : hasil.format === 'longgar-90'
                    ? 'simulasi longgar 90'
                    : 'paket soal'
                : `mode ${hasil.mode}`}
            </p>
            <div class="mt-1 flex items-end gap-3">
              <span class={`text-6xl font-bold tabular-nums leading-none ${lulus ? 'text-emerald-600' : 'text-rose-600'}`}>
                {skor.skor}
              </span>
              <span class="mb-1 text-sm text-slate-500">/ 100</span>
            </div>
            <p class="mt-1 text-sm text-slate-600">
              {skor.benar} benar · {skor.salah} salah · {skor.kosong} kosong · {skor.total} butir
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Skor kecepatan" value={`${kecepatanSkor}`} sub="akurasi × waktu" />
            <Stat label="Median" value={`${metrik.medianDetik}s`} sub={`p75 ${metrik.p75Detik}s`} />
            <Stat label="Tepat waktu" value={`${Math.round(metrik.persenTepatWaktu * 100)}%`} sub={`target ${targetRata}s`} />
            <Stat label="Durasi" value={formatMenitDetik(Math.round(hasil.durasiTotalMs / 1000))} sub="total sesi" />
          </div>
        </div>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            class={`h-full rounded-full ${lulus ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${skor.skor}%` }}
          />
        </div>
        <p class="mt-1.5 text-xs text-slate-500">
          Indeks kecepatan {metrik.indeks}x — {metrik.indeks >= 1 ? 'lebih cepat dari target pace' : 'lebih lambat dari target pace'}.
        </p>
      </section>

      {/* Akurasi per mapel */}
      <section class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(skor.akurasiMapel) as Mapel[]).map((m) => {
          const a = skor.akurasiMapel[m];
          const st = statusKekuatan(a.persen);
          return (
            <div class="card">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{MAPEL_META[m].kode}</p>
              <p class="mt-1 text-2xl font-bold tabular-nums text-slate-900">{a.persen}%</p>
              <p class="text-xs text-slate-500">{a.benar}/{a.total} benar</p>
              <span class={`mt-1 inline-block rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${st.color}`}>{st.label}</span>
            </div>
          );
        })}
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <CategoryBars data={barsKategori} judul="Akurasi per kategori (terlemah di atas)" />
        <CategoryBars data={barsKecepatan} judul="Median detik per kategori (terlambat di atas)" mode="detik" ambang={false} />
      </div>

      {/* Daftar butir */}
      <section class="card mt-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-bold text-slate-800">Pembahasan butir</h2>
          <label class="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={hanyaSalah}
              onChange={(e) => setHanyaSalah((e.target as HTMLInputElement).checked)}
              class="h-3.5 w-3.5 rounded border-slate-300 text-tn-600"
            />
            Hanya butir salah / kosong
          </label>
        </div>

        <ul class="divide-y divide-slate-100">
          {skor.salahItems.length === 0 && (
            <li class="py-6 text-center text-sm text-emerald-700">
              <Icon name="check" class="mx-auto mb-1 h-6 w-6" />
              Semua butir dijawab benar.
            </li>
          )}
          {(hanyaSalah ? skor.salahItems : items.map((item) => ({ item, jawaban: hasil.jawaban[item.id] ?? null })))
            .map(({ item, jawaban }) => {
              const terbuka = buka === item.id;
              const benar = jawaban === item.kunci;
              const teksKunci = item.pilihan.find((p) => p.kode === item.kunci)?.teks ?? '';
              return (
                <li class="py-2">
                  <button
                    class="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                    onClick={() => setBuka(terbuka ? null : item.id)}
                  >
                    <span
                      class={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                        jawaban ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {jawaban ? <Icon name="x" class="h-3.5 w-3.5" /> : '—'}
                    </span>
                    <span class="flex-1">
                      <span class="line-clamp-2 text-sm text-slate-800">
                        <RichText text={item.soal} as="span" />
                      </span>
                      <span class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{KATEGORI_BY_SLUG.get(item.kategori)?.nama}</span>
                        {benar ? (
                          <span class="chip-ok">benar</span>
                        ) : (
                          <span class="chip-danger">salah · kunci {item.kunci}</span>
                        )}
                        <span>jawabanmu {jawaban ?? 'kosong'}</span>
                        <span>{((hasil.durasiButir[item.id] ?? 0) / 1000).toFixed(1)}s</span>
                      </span>
                      {!benar && (
                        <span class="mt-1 block text-xs leading-relaxed text-emerald-800">
                          Koreksi: kunci <strong class="font-semibold">{item.kunci}</strong> — {teksKunci}
                        </span>
                      )}
                    </span>
                    <Icon name="chevron-down" class={`h-4 w-4 text-slate-400 transition ${terbuka ? 'rotate-180' : ''}`} />
                  </button>
                  {terbuka && (
                    <div class="mt-2">
                      <ExplainPanel item={item} jawaban={jawaban} />
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div class="rounded-lg border border-slate-200 px-3 py-2">
      <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p class="text-lg font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p class="text-[0.65rem] text-slate-500">{sub}</p>}
    </div>
  );
}
