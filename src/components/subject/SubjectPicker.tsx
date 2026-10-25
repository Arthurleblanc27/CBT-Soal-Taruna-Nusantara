import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Mapel } from '@data/schema';
import { KATEGORI, MAPEL_META } from '@data/taxonomy';
import { loadBank, type LoadedBank } from '@lib/bank';
import Icon from '../ui/Icon';

const URUT: Mapel[] = ['matematika', 'ipa', 'bindo', 'bing'];

const GAYA: Record<Mapel, { bg: string; text: string; ring: string; icon: 'target' | 'zap' | 'book' | 'list' }> = {
  matematika: { bg: 'bg-tn-50', text: 'text-tn-700', ring: 'hover:border-tn-300', icon: 'target' },
  ipa: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'hover:border-emerald-300', icon: 'zap' },
  bindo: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'hover:border-amber-300', icon: 'book' },
  bing: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'hover:border-indigo-300', icon: 'list' },
};

export default function SubjectPicker({ mode }: { mode: 'belajar' | 'cepat' }) {
  const [bank, setBank] = useState<LoadedBank | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBank().then((r) => {
      setBank(r.bank);
      setError(r.error ?? null);
    });
  }, []);

  const total = bank ? URUT.reduce((s, m) => s + (bank.byMapel.get(m)?.length ?? 0), 0) : 0;

  const label = mode === 'belajar' ? 'Mode belajar' : 'Mode cepat';
  const aksi = mode === 'belajar' ? 'Belajar' : 'Latihan cepat';
  const keterangan =
    mode === 'belajar'
      ? 'Tanpa batas waktu. Setiap butir langsung dinilai, lalu pembahasan tiga lapis muncul: inti, langkah, dan alasan pengecoh menarik.'
      : 'Setiap butir punya hitungan mundur sesuai target pace. Streak benar menambah waktu; hasil menampilkan median dan ketepatan waktu.';

  const daftar = useMemo(() => {
    if (!bank) return URUT.map((m) => ({ mapel: m, jumlah: 0, kategori: [] as { nama: string; n: number }[] }));
    return URUT.map((m) => {
      const items = bank.byMapel.get(m) ?? [];
      return {
        mapel: m,
        jumlah: items.length,
        kategori: KATEGORI.filter((k) => k.mapel === m).map((k) => ({
          nama: k.nama.replace(/^(Fisika|Kimia|Biologi|Bahasa Indonesia|Bahasa Inggris): /, ''),
          n: (bank.byKategori.get(k.slug) ?? []).length,
        })),
      };
    });
  }, [bank]);

  return (
    <div class="container-page py-6">
      <header class="mb-6">
        <a href="/" class="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
          <Icon name="left" class="h-3.5 w-3.5" /> Beranda
        </a>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">{label} · semua mata pelajaran</h1>
        <p class="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{keterangan}</p>
        <p class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span class="chip-brand">{total} butir siap dikerjakan</span>
          <span class="chip-neutral">4 mata pelajaran</span>
          <span class="chip-neutral">27 kategori resmi</span>
        </p>
      </header>

      {error && (
        <p class="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <Icon name="alert" class="h-4 w-4" /> {error}
        </p>
      )}

      <div class="grid gap-4 sm:grid-cols-2">
        {daftar.map((d) => {
          const meta = MAPEL_META[d.mapel];
          const g = GAYA[d.mapel];
          const siap = d.jumlah > 0;
          return (
            <article class={`card card-hover flex flex-col ${g.ring}`}>
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${g.bg} ${g.text}`}>
                    <Icon name={g.icon} class="h-5 w-5" />
                  </span>
                  <div>
                    <p class="eyebrow">{meta.kode}</p>
                    <h2 class="text-base font-bold leading-tight text-slate-900">{meta.nama}</h2>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold leading-none tabular-nums text-slate-900">{d.jumlah}</p>
                  <p class="text-[0.65rem] uppercase tracking-wide text-slate-400">butir</p>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-1.5">
                {d.kategori.map((k) => (
                  <span
                    class={`rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium ${
                      k.n > 0 ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-dashed border-slate-200 text-slate-400'
                    }`}
                    title={k.n > 0 ? `${k.n} butir` : 'belum ada butir'}
                  >
                    {k.nama}
                    {k.n > 0 ? <strong class="ml-1 font-semibold text-slate-900">{k.n}</strong> : null}
                  </span>
                ))}
              </div>

              <dl class="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div class="rounded-lg bg-slate-50 px-2 py-1.5">
                  <dt class="text-[0.6rem] uppercase tracking-wide text-slate-400">Target pace</dt>
                  <dd class="font-bold tabular-nums text-slate-800">{meta.targetDetik} dtk/butir</dd>
                </div>
                <div class="rounded-lg bg-slate-50 px-2 py-1.5">
                  <dt class="text-[0.6rem] uppercase tracking-wide text-slate-400">Acuan sesi</dt>
                  <dd class="font-bold tabular-nums text-slate-800">{meta.soalAcuan} butir</dd>
                </div>
              </dl>

              <div class="flex-1" />
              <a
                href={siap ? `/${mode}/${d.mapel}` : '/bank'}
                class={`mt-4 w-full justify-center ${siap ? 'btn-primary' : 'btn-secondary'}`}
                aria-disabled={!siap}
              >
                {siap ? (
                  <>
                    <Icon name="play" class="h-4 w-4" /> {aksi} {meta.nama}
                  </>
                ) : (
                  <>
                    <Icon name="database" class="h-4 w-4" /> Tambah butir di Bank
                  </>
                )}
              </a>
            </article>
          );
        })}
      </div>

      <section class="card-soft mt-6">
        <p class="text-sm font-semibold text-slate-800">Mata pelajaran lain juga tersedia di mode paket dan simulasi</p>
        <p class="mt-1 text-xs leading-relaxed text-slate-500">
          Empat mapel di atas adalah materi resmi Seleksi Akademik TN (Matematika, IPA, Bahasa Indonesia, Bahasa Inggris).
          Untuk latihan lintas mapel dalam satu sesi, gunakan paket soal atau simulasi padat-105.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <a href="/paket" class="btn-secondary btn-sm"><Icon name="list" class="h-3.5 w-3.5" /> Tiga paket soal</a>
          <a href="/simulasi" class="btn-ghost btn-sm"><Icon name="clock" class="h-3.5 w-3.5" /> Simulasi</a>
          <a href="/analitik" class="btn-ghost btn-sm"><Icon name="chart" class="h-3.5 w-3.5" /> Analitik</a>
        </div>
      </section>
    </div>
  );
}
