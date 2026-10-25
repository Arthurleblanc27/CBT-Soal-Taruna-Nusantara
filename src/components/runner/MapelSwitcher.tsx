import type { Mapel } from '@data/schema';

const MAPEL: { slug: Mapel; kode: string; nama: string }[] = [
  { slug: 'matematika', kode: 'MAT', nama: 'Matematika' },
  { slug: 'ipa', kode: 'IPA', nama: 'IPA' },
  { slug: 'bindo', kode: 'BIN', nama: 'B. Indonesia' },
  { slug: 'bing', kode: 'BIG', nama: 'B. Inggris' },
];

export default function MapelSwitcher({ mode, aktif }: { mode: 'belajar' | 'cepat'; aktif: Mapel }) {
  return (
    <nav class="mb-4 flex flex-wrap items-center gap-1.5" aria-label="Pilih mata pelajaran">
      <a
        href={`/${mode}`}
        class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
      >
        Semua mapel
      </a>
      <span class="text-slate-300">/</span>
      {MAPEL.map((m) => (
        <a
          href={`/${mode}/${m.slug}`}
          class={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            m.slug === aktif
              ? 'bg-tn-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
          }`}
          aria-current={m.slug === aktif ? 'page' : undefined}
        >
          {m.nama}
        </a>
      ))}
    </nav>
  );
}
