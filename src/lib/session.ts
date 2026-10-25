import type { Mapel } from '@data/schema';

export type ModeSesi = 'belajar' | 'cepat' | 'simulasi';
export type FormatSimulasi = 'padat-105' | 'longgar-90';

export interface BlokMapel {
  mapel: Mapel;
  mulaiMs: number;
  budgetDetik: number;
}

export interface Sesi {
  v: 2;
  id: string;
  mode: ModeSesi;
  format?: FormatSimulasi;
  daftarItem: string[];
  indeks: number;
  jawaban: Record<string, 'A' | 'B' | 'C' | 'D' | 'E' | null>;
  ragu: Record<string, true>;
  mulai: number;
  budgetDetik: number;
  blokMapel: BlokMapel[];
  putaran: 1 | 2;
  durasiButir: Record<string, number>;
  bankVersi: string;
  selesai?: number;
  pausedAt?: number;
}

export interface SesiResult {
  id: string;
  mode: ModeSesi;
  format?: FormatSimulasi;
  selesai: number;
  durasiTotalMs: number;
  jawaban: Record<string, 'A' | 'B' | 'C' | 'D' | 'E' | null>;
  durasiButir: Record<string, number>;
  daftarItem: string[];
  bankVersi: string;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSesi(opts: {
  mode: ModeSesi;
  format?: FormatSimulasi;
  daftarItem: string[];
  bankVersi: string;
  budgetDetik: number;
  blokMapel?: BlokMapel[];
}): Sesi {
  const now = Date.now();
  return {
    v: 2,
    id: generateId(),
    mode: opts.mode,
    format: opts.format,
    daftarItem: opts.daftarItem,
    indeks: 0,
    jawaban: {},
    ragu: {},
    mulai: now,
    budgetDetik: opts.budgetDetik,
    blokMapel: opts.blokMapel || [],
    putaran: 1,
    durasiButir: {},
    bankVersi: opts.bankVersi,
  };
}

export function sisaDetik(sesi: Sesi): number {
  if (sesi.selesai) return 0;
  const elapsed = (Date.now() - sesi.mulai) / 1000;
  return Math.max(0, sesi.budgetDetik - elapsed);
}

export function sisaDetikBlok(sesi: Sesi): number {
  if (!sesi.blokMapel.length) return sisaDetik(sesi);
  const current = sesi.blokMapel.find((_, i) => i === currentBlokIndex(sesi));
  if (!current) return sisaDetik(sesi);
  const elapsed = (Date.now() - current.mulaiMs) / 1000;
  return Math.max(0, current.budgetDetik - elapsed);
}

export function currentBlokIndex(sesi: Sesi): number {
  if (!sesi.blokMapel.length) return -1;
  const elapsed = (Date.now() - sesi.mulai) / 1000;
  let acc = 0;
  for (let i = 0; i < sesi.blokMapel.length; i++) {
    acc += sesi.blokMapel[i].budgetDetik;
    if (elapsed <= acc) return i;
  }
  return sesi.blokMapel.length - 1;
}

export function currentMapel(sesi: Sesi): Mapel | undefined {
  const idx = currentBlokIndex(sesi);
  return sesi.blokMapel[idx]?.mapel;
}

export function isFinished(sesi: Sesi): boolean {
  return !!sesi.selesai || sisaDetik(sesi) <= 0;
}

export function finishSesi(sesi: Sesi): SesiResult {
  const now = Date.now();
  return {
    id: sesi.id,
    mode: sesi.mode,
    format: sesi.format,
    selesai: now,
    durasiTotalMs: now - sesi.mulai,
    jawaban: sesi.jawaban,
    durasiButir: sesi.durasiButir,
    daftarItem: sesi.daftarItem,
    bankVersi: sesi.bankVersi,
  };
}

export function jawab(sesi: Sesi, itemId: string, jawaban: 'A' | 'B' | 'C' | 'D' | 'E' | null): Sesi {
  return { ...sesi, jawaban: { ...sesi.jawaban, [itemId]: jawaban } };
}

export function toggleRagu(sesi: Sesi, itemId: string): Sesi {
  const next = { ...sesi.ragu };
  if (next[itemId]) delete next[itemId];
  else next[itemId] = true;
  return { ...sesi, ragu: next };
}

export function nextIndex(sesi: Sesi): number {
  return Math.min(sesi.indeks + 1, sesi.daftarItem.length - 1);
}

export function prevIndex(sesi: Sesi): number {
  return Math.max(sesi.indeks - 1, 0);
}
