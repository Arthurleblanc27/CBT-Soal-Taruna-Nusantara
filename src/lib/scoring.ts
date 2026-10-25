import type { Item, Mapel } from '@data/schema';

export const nilaiButir = (jawaban: string | null, kunci: string): number => (jawaban === kunci ? 1 : 0);

export interface ScoreSummary {
  benar: number;
  salah: number;
  kosong: number;
  total: number;
  skor: number; // 0-100
  akurasiMapel: Record<Mapel, { benar: number; total: number; persen: number }>;
  akurasiKategori: Record<string, { benar: number; total: number; persen: number }>;
  salahItems: { item: Item; jawaban: string | null }[];
}

export function hitungSkor(
  jawaban: Record<string, string | null>,
  items: Item[]
): ScoreSummary {
  const summary: ScoreSummary = {
    benar: 0,
    salah: 0,
    kosong: 0,
    total: items.length,
    skor: 0,
    akurasiMapel: {} as Record<Mapel, { benar: number; total: number; persen: number }>,
    akurasiKategori: {},
    salahItems: [],
  };

  for (const item of items) {
    const j = jawaban[item.id] ?? null;
    const ok = nilaiButir(j, item.kunci);
    if (ok) summary.benar++;
    else if (j === null) summary.kosong++;
    else summary.salah++;

    // Mapel
    const am = summary.akurasiMapel[item.mapel] || { benar: 0, total: 0, persen: 0 };
    am.total++;
    if (ok) am.benar++;
    summary.akurasiMapel[item.mapel] = am;

    // Kategori
    const ak = summary.akurasiKategori[item.kategori] || { benar: 0, total: 0, persen: 0 };
    ak.total++;
    if (ok) ak.benar++;
    summary.akurasiKategori[item.kategori] = ak;

    if (!ok) summary.salahItems.push({ item, jawaban: j });
  }

  // Persentase
  for (const m of Object.keys(summary.akurasiMapel) as Mapel[]) {
    const a = summary.akurasiMapel[m];
    a.persen = a.total ? Math.round((a.benar / a.total) * 1000) / 10 : 0;
  }
  for (const k of Object.keys(summary.akurasiKategori)) {
    const a = summary.akurasiKategori[k];
    a.persen = a.total ? Math.round((a.benar / a.total) * 1000) / 10 : 0;
  }

  summary.skor = summary.total ? Math.round((summary.benar / summary.total) * 1000) / 10 : 0;
  return summary;
}

export function statusKekuatan(persen: number): { label: string; color: string } {
  if (persen >= 85) return { label: 'Kuat', color: 'text-emerald-600 bg-emerald-50' };
  if (persen >= 60) return { label: 'Cukup', color: 'text-amber-600 bg-amber-50' };
  return { label: 'Lemah', color: 'text-rose-600 bg-rose-50' };
}
