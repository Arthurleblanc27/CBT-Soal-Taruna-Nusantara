import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Item, Mapel } from '@data/schema';
import { KATEGORI_BY_SLUG, MAPEL_META } from '@data/taxonomy';
import { ambilHasil, daftarHasilId } from '@lib/analytics';
import { loadBank, type LoadedBank } from '@lib/bank';
import type { SesiResult } from '@lib/session';
import { hitungSkor, statusKekuatan } from '@lib/scoring';
import { metrikKecepatan } from '@lib/speed';
import CategoryBars, { type BarData } from '../charts/CategoryBars';
import Icon from '../ui/Icon';

export default function AnalitikView() {
  const [bank, setBank] = useState<LoadedBank | null>(null);
  const [hasil, setHasil] = useState<SesiResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = daftarHasilId();
    setHasil(ids.map((id) => ambilHasil(id)).filter(Boolean) as SesiResult[]);
    loadBank().then((res) => {
      setBank(res.bank);
      setLoading(false);
    });
  }, []);

  const rekap = useMemo(() => {
    if (!bank) return null;
    const perMapel: Record<string, { benar: number; total: number }> = {};
    const perKategori: Record<string, { benar: number; total: number; times: number[] }> = {};
    let totalBenar = 0;
    let totalButir = 0;

    for (const r of hasil) {
      const items = r.daftarItem.map((id) => bank.byId.get(id)).filter(Boolean) as Item[];
      if (!items.length) continue;
      const s = hitungSkor(r.jawaban, items);
      totalBenar += s.benar;
      totalButir += s.total;
      for (const [m, a] of Object.entries(s.akurasiMapel)) {
        const cur = (perMapel[m] ||= { benar: 0, total: 0 });
        cur.benar += a.benar;
        cur.total += a.total;
      }
      for (const it of items) {
        const cur = (perKategori[it.kategori] ||= { benar: 0, total: 0, times: [] });
        cur.total++;
        if (r.jawaban[it.id] === it.kunci) cur.benar++;
        const ms = r.durasiButir[it.id];
        if (ms && ms > 800 && ms < 600_000) cur.times.push(ms);
      }
    }

    const kategori = Object.entries(perKategori)
      .map(([slug, v]) => {
        const kat = KATEGORI_BY_SLUG.get(slug);
        const m = metrikKecepatan(v.times, kat?.targetDetik ?? 60);
        return {
          slug,
          nama: kat?.nama ?? slug,
          mapel: kat?.mapel ?? 'matematika',
          persen: v.total ? Math.round((v.benar / v.total) * 1000) / 10 : 0,
          benar: v.benar,
          total: v.total,
          medianDetik: m.medianDetik,
          indeks: m.indeks,
        };
      })
      .sort((a, b) => a.persen - b.persen);

    return {
      perMapel,
      kategori,
      totalBenar,
      totalButir,
      akurasi: totalButir ? Math.round((totalBenar / totalButir) * 1000) / 10 : 0,
      sesi: hasil.length,
    };
  }, [hasil, bank]);

  if (loading) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16 text-center">
        <span class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-2 border-tn-500 border-t-transparent" />
        <p class="mt-3 text-sm text-slate-600">Menyusun analitik…</p>
      </div>
    );
  }

  if (!hasil.length || !rekap) {
    return (
      <div class="mx-auto max-w-xl px-4 py-16 text-center">
        <Icon name="chart" class="mx-auto h-10 w-10 text-slate-300" />
        <h1 class="mt-3 text-xl font-bold text-slate-800">Belum ada data analitik</h1>
        <p class="mt-1 text-sm text-slate-600">
          Selesaikan satu sesi belajar, cepat, atau simulasi. Semua hasil tersimpan lokal di browser ini.
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <a href="/belajar/matematika" class="btn-primary">Mulai belajar</a>
          <a href="/simulasi" class="btn-secondary">Coba simulasi</a>
        </div>
      </div>
    );
  }

  const barsMapel: BarData[] = (Object.keys(rekap.perMapel) as Mapel[]).map((m) => {
    const a = rekap.perMapel[m];
    return {
      label: MAPEL_META[m].nama,
      value: a.total ? Math.round((a.benar / a.total) * 1000) / 10 : 0,
      hint: `${a.benar}/${a.total}`,
    };
  });

  const barsLambat: BarData[] = [...rekap.kategori]
    .sort((a, b) => b.medianDetik - a.medianDetik)
    .slice(0, 8)
    .map((k) => ({
      label: k.nama,
      value: k.medianDetik,
      hint: `target ${KATEGORI_BY_SLUG.get(k.slug)?.targetDetik ?? 60}s · indeks ${k.indeks}x`,
    }));
  const maxLambat = Math.max(...barsLambat.map((b) => b.value), 1);

  const terlemah = rekap.kategori.slice(0, 5);

  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <header class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Analitik</h1>
          <p class="mt-1 text-sm text-slate-600">
            Rekap {rekap.sesi} sesi · {rekap.totalButir} butir dikerjakan · akurasi total {rekap.akurasi}%
          </p>
        </div>
        <button
          class="btn-secondary no-print"
          onClick={() => {
            if (confirm('Hapus semua hasil dan analitik di browser ini?')) {
              const keys: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k?.startsWith('tntrainer:hasil')) keys.push(k);
              }
              keys.forEach((k) => localStorage.removeItem(k));
              location.reload();
            }
          }}
        >
          <Icon name="x" class="h-4 w-4" /> Hapus data hasil
        </button>
      </header>

      <div class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kartu label="Sesi selesai" value={`${rekap.sesi}`} sub="tersimpan lokal" />
        <Kartu label="Butir dikerjakan" value={`${rekap.totalButir}`} sub={`${rekap.totalBenar} benar`} />
        <Kartu label="Akurasi total" value={`${rekap.akurasi}%`} sub="semua sesi" />
        <Kartu
          label="Kategori terlemah"
          value={terlemah[0] ? `${terlemah[0].persen}%` : '—'}
          sub={terlemah[0]?.nama ?? '—'}
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <CategoryBars data={barsMapel} judul="Akurasi per mapel" />
        <CategoryBars data={barsLambat.map((b) => ({ ...b, max: maxLambat }))} judul="Kategori paling lambat" mode="detik" ambang={false} />
      </div>

      <section class="card mt-4">
        <h2 class="mb-3 text-sm font-bold text-slate-800">Prioritas perbaikan</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-xs text-slate-400">
              <tr class="border-b border-slate-100">
                <th class="pb-2 font-semibold">Kategori</th>
                <th class="pb-2 font-semibold">Mapel</th>
                <th class="pb-2 text-right font-semibold">Akurasi</th>
                <th class="pb-2 text-right font-semibold">Benar</th>
                <th class="pb-2 text-right font-semibold">Median</th>
                <th class="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {terlemah.map((k) => {
                const st = statusKekuatan(k.persen);
                return (
                  <tr class="border-b border-slate-50 text-slate-700">
                    <td class="py-2 font-medium">{k.nama}</td>
                    <td class="py-2 text-xs text-slate-500">{MAPEL_META[k.mapel as Mapel]?.kode}</td>
                    <td class="py-2 text-right tabular-nums">{k.persen}%</td>
                    <td class="py-2 text-right tabular-nums text-slate-500">{k.benar}/{k.total}</td>
                    <td class="py-2 text-right tabular-nums">{k.medianDetik}s</td>
                    <td class="py-2 text-right">
                      <span class={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${st.color}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-slate-500">
          Ambang status: Lemah &lt; 60% · Cukup 60–84% · Kuat ≥ 85%. Kecepatan diukur dari median detik per butir.
        </p>
      </section>

      <section class="card mt-4">
        <h2 class="mb-3 text-sm font-bold text-slate-800">Riwayat sesi</h2>
        <ul class="divide-y divide-slate-100 text-sm">
          {hasil.slice(0, 20).map((r) => {
            const items = r.daftarItem.map((id) => bank?.byId.get(id)).filter(Boolean) as Item[];
            const s = hitungSkor(r.jawaban, items);
            return (
              <li class="flex items-center justify-between gap-3 py-2">
                <div>
                  <p class="font-medium text-slate-800">
                    {r.mode === 'simulasi' ? `Simulasi ${r.format ?? ''}` : `Mode ${r.mode}`}
                  </p>
                  <p class="text-xs text-slate-500">
                    {new Date(r.selesai).toLocaleString('id-ID')} · {items.length} butir
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <span class={`text-sm font-bold tabular-nums ${s.skor >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {s.skor}
                  </span>
                  <a href={`/hasil?id=${r.id}`} class="text-xs font-semibold text-tn-600 hover:underline">
                    Lihat
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Kartu({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div class="card">
      <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p class="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p class="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
