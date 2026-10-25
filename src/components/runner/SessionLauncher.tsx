import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Item, Mapel } from '@data/schema';
import { MAPEL_META, KATEGORI } from '@data/taxonomy';
import { loadBank, type LoadedBank } from '@lib/bank';
import { createSesi, type Sesi, type ModeSesi, type FormatSimulasi } from '@lib/session';
import { bacaSesiAktif, hapusSesiAktif } from '@lib/sessionStore';
import { finalisasiKedaluwarsa } from '@lib/recovery';
import {
  pilihItemBelajar,
  pilihItemCepat,
  komposisiSimulasi,
  komposisiLonggar,
  ringkasKekurangan,
  BLOK_PADAT,
} from '@lib/selection';
import ExamRunner from './ExamRunner';
import Icon from '../ui/Icon';

type Tingkat = 'mudah' | 'sedang' | 'sulit';

export default function SessionLauncher({
  mode,
  mapel,
  format,
  debug = false,
}: {
  mode: ModeSesi;
  mapel?: Mapel;
  format?: FormatSimulasi;
  debug?: boolean;
}) {
  // Situs ini statis, jadi ?debug=1 tidak bisa dibaca saat build — baca di klien.
  const debugAktif =
    debug || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1');

  const [bank, setBank] = useState<LoadedBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kategoriDipilih, setKategoriDipilih] = useState<string[]>([]);
  const [tingkatDipilih, setTingkatDipilih] = useState<Tingkat[]>([]);
  // Default: seluruh butir pada filter aktif. Pengguna dapat menurunkannya lewat slider.
  const [jumlah, setJumlah] = useState(Number.MAX_SAFE_INTEGER);
  const [mapelLonggar, setMapelLonggar] = useState<Mapel>('matematika');

  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [sesiLama, setSesiLama] = useState<Sesi | null>(null);

  useEffect(() => {
    const kedaluwarsa = finalisasiKedaluwarsa();
    if (kedaluwarsa) {
      window.location.href = `/hasil?id=${kedaluwarsa.id}`;
      return;
    }
    loadBank().then((res) => {
      setBank(res.bank);
      setError(res.error ?? null);
      setLoading(false);
    });
    setSesiLama(bacaSesiAktif());
  }, [mode]);

  const pool = useMemo(() => {
    if (!bank || !mapel) return [];
    let list = bank.byMapel.get(mapel) || [];
    if (kategoriDipilih.length) list = list.filter((i) => kategoriDipilih.includes(i.kategori));
    if (tingkatDipilih.length) list = list.filter((i) => tingkatDipilih.includes(i.tingkat));
    return list;
  }, [bank, mapel, kategoriDipilih, tingkatDipilih]);

  const kategoriTersedia = useMemo(
    () => (mapel ? KATEGORI.filter((k) => k.mapel === mapel) : []),
    [mapel]
  );

  if (loading) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16 text-center">
        <span class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-2 border-tn-500 border-t-transparent" />
        <p class="mt-3 text-sm text-slate-600">Memuat bank soal…</p>
      </div>
    );
  }

  if (sesi) {
    const items = sesi.daftarItem
      .map((id) => bank?.byId.get(id))
      .filter(Boolean) as Item[];
    return (
      <ExamRunner
        mode={sesi.mode}
        format={sesi.format}
        items={items}
        sesiAwal={sesi}
        bankVersi={sesi.bankVersi}
        debug={debugAktif}
        judul={
          sesi.mode === 'simulasi'
            ? `Simulasi ${sesi.format === 'padat-105' ? 'Padat 105' : 'Longgar 90'}`
            : sesi.mode === 'belajar'
              ? `Belajar ${MAPEL_META[(mapel ?? 'matematika') as Mapel].nama}`
              : `Latihan Cepat ${MAPEL_META[(mapel ?? 'matematika') as Mapel].nama}`
        }
      />
    );
  }

  const mulai = () => {
    if (!bank) return;

    if (mode === 'belajar' && mapel) {
      const items = pilihItemBelajar(bank, {
        mapel,
        kategori: kategoriDipilih.length ? kategoriDipilih : undefined,
        tingkat: tingkatDipilih.length ? tingkatDipilih : undefined,
        jumlah: Math.min(jumlah, pool.length),
      });
      if (!items.length) return;
      const s = createSesi({
        mode,
        daftarItem: items.map((i) => i.id),
        bankVersi: bank.manifest.versi,
        budgetDetik: 0,
      });
      setSesi(s);
      return;
    }

    if (mode === 'cepat' && mapel) {
      const items = pilihItemCepat(bank, mapel, Math.min(jumlah, pool.length));
      if (!items.length) return;
      const s = createSesi({
        mode,
        daftarItem: items.map((i) => i.id),
        bankVersi: bank.manifest.versi,
        budgetDetik: items.reduce((sum, i) => sum + i.targetDetik, 0) + 15 * items.length,
      });
      setSesi(s);
      return;
    }

    if (mode === 'simulasi') {
      const komp =
        format === 'longgar-90'
          ? komposisiLonggar(bank, mapelLonggar, debugAktif ? 2 : 90)
          : komposisiSimulasi(bank, 'padat-105');
      if (!komp.daftarItem.length) return;

      let budget = komp.budgetDetik;
      let blok = komp.blok;
      if (debugAktif) {
        const now = Date.now();
        if (format === 'padat-105') {
          let acc = 0;
          blok = komp.blok.map((b) => {
            const nb = { ...b, mulaiMs: now + acc * 1000, budgetDetik: 30 };
            acc += 30;
            return nb;
          });
          budget = 30 * komp.blok.length;
        } else {
          blok = [{ ...komp.blok[0], mulaiMs: now, budgetDetik: 120 }];
          budget = 120;
        }
      }

      const s = createSesi({
        mode,
        format,
        daftarItem: komp.daftarItem.map((i) => i.id),
        bankVersi: bank.manifest.versi,
        budgetDetik: budget,
        blokMapel: blok,
      });
      setSesi(s);
    }
  };

  // Jumlah yang diminta selalu dipotong ke isi pool; tombol tetap aktif selama pool berisi butir.
  const jumlahEfektif = Math.min(jumlah, pool.length);
  const maxPilih = Math.max(1, pool.length);
  const penuh = pool.length > 0 && jumlah >= pool.length;
  const cukup = pool.length > 0;

  return (
    <div class="mx-auto max-w-5xl px-4 py-6">
      <header class="mb-5">
        <a href="/" class="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
          <Icon name="left" class="h-3.5 w-3.5" /> Beranda
        </a>
        <h1 class="text-2xl font-bold text-slate-900">
          {mode === 'belajar'
            ? `Mode Belajar · ${mapel ? MAPEL_META[mapel].nama : ''}`
            : mode === 'cepat'
              ? `Mode Cepat · ${mapel ? MAPEL_META[mapel].nama : ''}`
              : `Simulasi ${format === 'padat-105' ? 'Padat 105' : 'Longgar 90'}`}
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600">
          {mode === 'belajar'
            ? 'Tanpa timer global. Umpan balik instan dan pembahasan tiga lapis: inti · langkah · jebakan.'
            : mode === 'cepat'
              ? 'Countdown per butir sesuai target pace. Skor kecepatan = akurasi × kepatuhan waktu.'
              : format === 'padat-105'
                ? 'Empat mapel berurutan dengan checkpoint 35 · 65 · 85 · 105 menit. Skor 1/0/0 tanpa penalti.'
                : 'Satu mapel dalam 90 menit. Cocok untuk latihan stamina satu bidang.'}
        </p>
      </header>

      {sesiLama && (
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div class="flex items-start gap-2 text-sm text-amber-900">
            <Icon name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p class="font-semibold">Ada sesi {sesiLama.mode} yang belum selesai.</p>
              <p class="text-xs text-amber-800">
                Sisa waktu {Math.max(0, Math.round(sesiLama.budgetDetik - (Date.now() - sesiLama.mulai) / 1000))} detik ·{' '}
                {sesiLama.daftarItem.length} butir · jawaban tersimpan.
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary" onClick={() => hapusSesiAktif()}>
              Buang
            </button>
            <button
              class="btn-primary"
              onClick={() => {
                setSesi(sesiLama);
                setSesiLama(null);
              }}
            >
              Lanjutkan sesi
            </button>
          </div>
        </div>
      )}

      {error && (
        <p class="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <Icon name="alert" class="h-4 w-4" /> {error}
        </p>
      )}

      {mode === 'simulasi' ? (
        <SimulasiSetup
          bank={bank!}
          format={format!}
          debug={debugAktif}
          mapelLonggar={mapelLonggar}
          setMapelLonggar={setMapelLonggar}
          onMulai={mulai}
        />
      ) : (
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="space-y-4">
            <div class="card">
              <div class="mb-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-800">Kategori</h2>
                <button
                  class="text-xs font-semibold text-tn-600 hover:underline"
                  onClick={() => setKategoriDipilih([])}
                >
                  Semua kategori
                </button>
              </div>
              <div class="grid gap-1.5 sm:grid-cols-2">
                {kategoriTersedia.map((k) => {
                  const n = (bank?.byKategori.get(k.slug) || []).length;
                  const aktif = kategoriDipilih.includes(k.slug);
                  return (
                    <label
                      class={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                        aktif ? 'border-tn-500 bg-tn-50' : 'border-slate-200 hover:border-slate-300'
                      } ${n === 0 ? 'opacity-50' : ''}`}
                    >
                      <span class="flex items-center gap-2">
                        <input
                          type="checkbox"
                          class="h-3.5 w-3.5 rounded border-slate-300 accent-tn-600 text-tn-600 focus:ring-tn-500"
                          checked={aktif}
                          disabled={n === 0}
                          onChange={(e) => {
                            const on = (e.target as HTMLInputElement).checked;
                            setKategoriDipilih((prev) =>
                              on ? [...prev, k.slug] : prev.filter((s) => s !== k.slug)
                            );
                          }}
                        />
                        <span class="font-medium text-slate-700">{k.nama}</span>
                      </span>
                      <span class="tabular-nums text-slate-400">{n}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="card">
                <h2 class="mb-2 text-sm font-bold text-slate-800">Tingkat</h2>
                <div class="flex flex-wrap gap-2">
                  {(['mudah', 'sedang', 'sulit'] as Tingkat[]).map((t) => {
                    const aktif = tingkatDipilih.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() =>
                          setTingkatDipilih((prev) =>
                            aktif ? prev.filter((x) => x !== t) : [...prev, t]
                          )
                        }
                        class={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                          aktif
                            ? 'border-tn-500 bg-tn-50 text-tn-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <p class="mt-2 text-xs text-slate-500">
                  {tingkatDipilih.length ? 'Hanya tingkat terpilih.' : 'Semua tingkat.'}
                </p>
              </div>

              <div class="card">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <h2 class="text-sm font-bold text-slate-800">Jumlah butir</h2>
                  <button
                    type="button"
                    onClick={() => setJumlah(maxPilih)}
                    class="text-xs font-semibold text-tn-700 hover:underline"
                    disabled={penuh}
                  >
                    {penuh ? 'Semua butir dipakai' : 'Pakai semua'}
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={maxPilih}
                    step={1}
                    value={jumlahEfektif}
                    onInput={(e) => setJumlah(Number((e.target as HTMLInputElement).value))}
                    class="w-full accent-tn-600"
                  />
                  <span class="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-slate-800">
                    {jumlahEfektif}
                    <span class="text-xs font-normal text-slate-400">/{pool.length}</span>
                  </span>
                </div>
                <p class={`mt-2 text-xs ${penuh ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {penuh
                    ? `Seluruh ${pool.length} butir pada filter ini dipakai.`
                    : `Memakai ${jumlahEfektif} dari ${pool.length} butir yang tersedia.`}
                </p>
              </div>
            </div>
          </div>

          <aside class="space-y-3">
            <div class="card">
              <h2 class="mb-2 text-sm font-bold text-slate-800">Ringkasan</h2>
              <dl class="space-y-1.5 text-xs">
                <Baris label="Mapel" value={mapel ? MAPEL_META[mapel].nama : '—'} />
                <Baris label="Butir dipilih" value={`${jumlahEfektif}`} />
                <Baris
                  label="Target pace"
                  value={`${mapel ? MAPEL_META[mapel].targetDetik : '—'} dtk/butir`}
                />
                <Baris
                  label="Perkiraan durasi"
                  value={
                    mode === 'cepat'
                      ? `${Math.round(((mapel ? MAPEL_META[mapel].targetDetik : 60) * jumlahEfektif) / 60)} menit`
                      : 'Tanpa batas'
                  }
                />
                <Baris label="Bank" value={`${bank?.items.length ?? 0} butir`} />
              </dl>
              <button class="btn-primary mt-4 w-full" onClick={mulai} disabled={!cukup}>
                <Icon name="play" class="h-4 w-4" /> Mulai sesi
              </button>
              {!cukup && (
                <p class="mt-2 text-center text-xs text-rose-600">
                  Tidak ada butir pada filter ini. Pilih kategori lain atau longgarkan filter tingkat.
                </p>
              )}
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p class="mb-1 font-semibold text-slate-700">Pintasan keyboard</p>
              <p><kbd>A</kbd>–<kbd>E</kbd> pilih jawaban · <kbd>←</kbd><kbd>→</kbd> pindah · <kbd>Enter</kbd> lanjut · <kbd>F</kbd> ragu</p>
            </div>
          </aside>
        </div>
      )}

      {mode !== 'simulasi' && (
        <section class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="card-soft">
            <p class="eyebrow">Langkah 1</p>
            <p class="mt-1 text-sm font-semibold text-slate-800">Pilih filter</p>
            <p class="mt-0.5 text-xs leading-relaxed text-slate-500">
              Kosongkan kategori untuk mengambil semua butir, atau batasi ke satu topik yang ingin diperkuat.
            </p>
          </div>
          <div class="card-soft">
            <p class="eyebrow">Langkah 2</p>
            <p class="mt-1 text-sm font-semibold text-slate-800">Tekan mulai</p>
            <p class="mt-0.5 text-xs leading-relaxed text-slate-500">
              Jumlah butir otomatis menyesuaikan isi bank. Mode belajar tanpa batas waktu, mode cepat dibatasi target pace.
            </p>
          </div>
          <div class="card-soft">
            <p class="eyebrow">Langkah 3</p>
            <p class="mt-1 text-sm font-semibold text-slate-800">Baca pembahasan</p>
            <p class="mt-0.5 text-xs leading-relaxed text-slate-500">
              Setiap butir punya inti, langkah penyelesaian, dan alasan kenapa pengecoh menarik dipilih.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div class="flex items-center justify-between">
      <dt class="text-slate-500">{label}</dt>
      <dd class="font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

function SimulasiSetup({
  bank,
  format,
  debug,
  mapelLonggar,
  setMapelLonggar,
  onMulai,
}: {
  bank: LoadedBank;
  format: FormatSimulasi;
  debug: boolean;
  mapelLonggar: Mapel;
  setMapelLonggar: (m: Mapel) => void;
  onMulai: () => void;
}) {
  if (format === 'padat-105') {
    const cukup = BLOK_PADAT.every((b) => (bank.byMapel.get(b.mapel) || []).length >= 4);
    return (
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="card">
          <h2 class="mb-3 text-sm font-bold text-slate-800">Pembagian blok</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-xs text-slate-400">
                <tr class="border-b border-slate-100">
                  <th class="pb-2 font-semibold">#</th>
                  <th class="pb-2 font-semibold">Mapel</th>
                  <th class="pb-2 font-semibold">Durasi</th>
                  <th class="pb-2 font-semibold">Butir</th>
                  <th class="pb-2 font-semibold">Checkpoint</th>
                  <th class="pb-2 text-right font-semibold">Tersedia</th>
                </tr>
              </thead>
              <tbody>
                {BLOK_PADAT.map((b, i) => {
                  const cp = BLOK_PADAT.slice(0, i + 1).reduce((s, x) => s + x.menit, 0);
                  const tersedia = (bank.byMapel.get(b.mapel) || []).length;
                  return (
                    <tr class="border-b border-slate-50 text-slate-700">
                      <td class="py-2 tabular-nums text-slate-400">{i + 1}</td>
                      <td class="py-2 font-medium">{MAPEL_META[b.mapel].nama}</td>
                      <td class="py-2 tabular-nums">{debug ? 0.5 : b.menit} mnt</td>
                      <td class="py-2 tabular-nums">{b.soal}</td>
                      <td class="py-2 tabular-nums text-slate-500">menit {cp}</td>
                      <td class={`py-2 text-right tabular-nums ${tersedia < b.soal ? 'text-amber-600' : 'text-slate-500'}`}>
                        {tersedia}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p class="mt-3 text-xs text-slate-500">
            Total {debug ? '2' : '105'} menit · {BLOK_PADAT.reduce((s, b) => s + b.soal, 0)} butir acuan. Bila bank
            belum mencukupi, sesi memakai butir yang tersedia dan menampilkan peringatan.
          </p>
        </div>
        <aside class="space-y-3">
          <div class="card">
            <h2 class="mb-2 text-sm font-bold text-slate-800">Aturan skor</h2>
            <ul class="space-y-1 text-xs text-slate-600">
              <li>Benar = 1 · salah = 0 · kosong = 0</li>
              <li>Tidak ada penalti salah</li>
              <li>Timer tidak bisa dijeda</li>
              <li>Reload memulihkan jawaban dan sisa waktu</li>
            </ul>
            <button class="btn-primary mt-4 w-full" onClick={onMulai} disabled={!cukup}>
              <Icon name="play" class="h-4 w-4" /> Mulai simulasi
            </button>
            {!cukup && (
              <p class="mt-2 text-center text-xs text-amber-600">
                Bank belum punya minimal 4 butir di setiap mapel.
              </p>
            )}
          </div>
        </aside>
      </div>
    );
  }

  const pool = bank.byMapel.get(mapelLonggar) || [];
  const ideal = Math.floor((90 * 60) / MAPEL_META[mapelLonggar].targetDetik);
  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="card">
        <h2 class="mb-2 text-sm font-bold text-slate-800">Pilih mapel</h2>
        <div class="grid gap-2 sm:grid-cols-2">
          {(['matematika', 'ipa', 'bindo', 'bing'] as Mapel[]).map((m) => {
            const n = (bank.byMapel.get(m) || []).length;
            const aktif = mapelLonggar === m;
            return (
              <button
                onClick={() => setMapelLonggar(m)}
                class={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                  aktif ? 'border-tn-500 bg-tn-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>
                  <span class="block text-sm font-semibold text-slate-800">{MAPEL_META[m].nama}</span>
                  <span class="text-xs text-slate-500">{MAPEL_META[m].targetDetik} dtk/butir</span>
                </span>
                <span class="text-xs tabular-nums text-slate-400">{n} butir</span>
              </button>
            );
          })}
        </div>
        <p class="mt-3 text-xs text-slate-500">
          Durasi 90 menit. Idealnya {Math.min(ideal, pool.length)} butir; tersedia {pool.length} butir.
          {pool.length < ideal && (
            <span class="text-amber-600"> Bank belum cukup untuk sesi penuh — timer tetap 90 menit.</span>
          )}
        </p>
      </div>
      <aside class="space-y-3">
        <div class="card">
          <h2 class="mb-2 text-sm font-bold text-slate-800">Ringkasan</h2>
          <dl class="space-y-1.5 text-xs">
            <Baris label="Mapel" value={MAPEL_META[mapelLonggar].nama} />
            <Baris label="Durasi" value="90 menit" />
            <Baris label="Butir" value={`${pool.length}`} />
            <Baris label="Target pace" value={`${MAPEL_META[mapelLonggar].targetDetik} dtk`} />
          </dl>
          <button class="btn-primary mt-4 w-full" onClick={onMulai} disabled={pool.length === 0}>
            <Icon name="play" class="h-4 w-4" /> Mulai simulasi
          </button>
        </div>
      </aside>
    </div>
  );
}
