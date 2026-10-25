import type { Item, Mapel } from '@data/schema';
import { KATEGORI, MAPEL_META } from '@data/taxonomy';
import type { LoadedBank } from './bank';
import type { BlokMapel, FormatSimulasi, ModeSesi } from './session';

export function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = [...arr];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface FilterBelajar {
  mapel: Mapel;
  kategori?: string[];
  tingkat?: ('mudah' | 'sedang' | 'sulit')[];
  jumlah?: number;
}

export function pilihItemBelajar(bank: LoadedBank, filter: FilterBelajar): Item[] {
  let pool = bank.byMapel.get(filter.mapel) || [];
  if (filter.kategori?.length) pool = pool.filter((i) => filter.kategori!.includes(i.kategori));
  if (filter.tingkat?.length) pool = pool.filter((i) => filter.tingkat!.includes(i.tingkat));
  const n = Math.min(filter.jumlah ?? pool.length, pool.length);
  return shuffle(pool).slice(0, n);
}

export function pilihItemCepat(bank: LoadedBank, mapel: Mapel, jumlah = 20): Item[] {
  const pool = bank.byMapel.get(mapel) || [];
  return shuffle(pool).slice(0, Math.min(jumlah, pool.length));
}

/** Komposisi blok padat-105 sesuai target pace resmi. */
export const BLOK_PADAT: { mapel: Mapel; menit: number; soal: number }[] = [
  { mapel: 'matematika', menit: 35, soal: 30 },
  { mapel: 'ipa', menit: 30, soal: 40 },
  { mapel: 'bindo', menit: 20, soal: 40 },
  { mapel: 'bing', menit: 20, soal: 35 },
];

export function komposisiSimulasi(bank: LoadedBank, format: FormatSimulasi): {
  daftarItem: Item[];
  blok: BlokMapel[];
  budgetDetik: number;
  kurang: Record<string, number>;
} {
  const kurang: Record<string, number> = {};

  if (format === 'padat-105') {
    const now = Date.now();
    let acc = 0;
    const blok: BlokMapel[] = [];
    const picked: Item[] = [];
    for (const b of BLOK_PADAT) {
      const pool = bank.byMapel.get(b.mapel) || [];
      const ambil = shuffle(pool).slice(0, Math.min(b.soal, pool.length));
      if (ambil.length < b.soal) kurang[b.mapel] = b.soal - ambil.length;
      picked.push(...ambil);
      blok.push({ mapel: b.mapel, mulaiMs: now + acc * 60_000, budgetDetik: b.menit * 60 });
      acc += b.menit;
    }
    return { daftarItem: picked, blok, budgetDetik: acc * 60, kurang };
  }

  // longgar-90: satu mapel, durasi 90 menit
  const mapel: Mapel = 'matematika';
  return komposisiLonggar(bank, mapel, 90);
}

export function komposisiLonggar(bank: LoadedBank, mapel: Mapel, menit = 90): {
  daftarItem: Item[];
  blok: BlokMapel[];
  budgetDetik: number;
  kurang: Record<string, number>;
} {
  const target = MAPEL_META[mapel].targetDetik;
  const ideal = Math.floor((menit * 60) / target);
  const pool = bank.byMapel.get(mapel) || [];
  const picked = shuffle(pool).slice(0, Math.min(ideal, pool.length));
  const kurang: Record<string, number> = {};
  if (picked.length < ideal) kurang[mapel] = ideal - picked.length;
  return {
    daftarItem: picked,
    blok: [{ mapel, mulaiMs: Date.now(), budgetDetik: menit * 60 }],
    budgetDetik: menit * 60,
    kurang,
  };
}

export function ringkasKekurangan(kurang: Record<string, number>): string {
  const entries = Object.entries(kurang);
  if (!entries.length) return '';
  return entries.map(([m, n]) => `${MAPEL_META[m as Mapel].kode} kurang ${n} butir`).join(' · ');
}

export function kategoriUntuk(mapel: Mapel) {
  return KATEGORI.filter((k) => k.mapel === mapel);
}

export function modeLabel(mode: ModeSesi): string {
  return mode === 'belajar' ? 'Belajar' : mode === 'cepat' ? 'Cepat' : 'Simulasi';
}
