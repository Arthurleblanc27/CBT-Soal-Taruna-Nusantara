import type { SesiResult } from './session';
import type { LoadedBank } from './bank';
import { hitungSkor } from './scoring';
import { metrikKecepatan } from './speed';
import { KATEGORI_BY_SLUG } from '@data/taxonomy';

const LS_HASIL = 'tntrainer:hasil';

export function simpanHasil(result: SesiResult): void {
  const key = `${LS_HASIL}:${result.id}`;
  localStorage.setItem(key, JSON.stringify(result));
  const list = daftarHasilId();
  if (!list.includes(result.id)) {
    list.unshift(result.id);
    localStorage.setItem(`${LS_HASIL}:list`, JSON.stringify(list.slice(0, 50)));
  }
}

export function daftarHasilId(): string[] {
  try {
    return JSON.parse(localStorage.getItem(`${LS_HASIL}:list`) || '[]') as string[];
  } catch {
    return [];
  }
}

export function ambilHasil(id: string): SesiResult | null {
  // "list" bukan hasil sesi; id tak dikenal atau data rusak harus mengembalikan null,
  // bukan objek sembarang yang membuat halaman hasil gagal dirender.
  if (!id || id === 'list') return null;
  try {
    const raw = JSON.parse(localStorage.getItem(`${LS_HASIL}:${id}`) || 'null') as SesiResult | null;
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.daftarItem)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function rekapHasil(results: SesiResult[], bank: LoadedBank) {
  const akurasiMapel: Record<string, { benar: number; total: number }> = {};
  const kecepatanKategori: Record<string, number[]> = {};

  for (const r of results) {
    const items = r.daftarItem.map((id) => bank.byId.get(id)).filter(Boolean);
    if (items.length === 0) continue;
    const score = hitungSkor(r.jawaban, items as any);
    for (const [mapel, a] of Object.entries(score.akurasiMapel)) {
      const cur = akurasiMapel[mapel] || { benar: 0, total: 0 };
      cur.benar += a.benar;
      cur.total += a.total;
      akurasiMapel[mapel] = cur;
    }
    for (const [id, ms] of Object.entries(r.durasiButir)) {
      const item = bank.byId.get(id);
      if (!item) continue;
      const list = kecepatanKategori[item.kategori] || [];
      list.push(ms);
      kecepatanKategori[item.kategori] = list;
    }
  }

  const kategoriRekap = Object.entries(kecepatanKategori).map(([slug, times]) => {
    const kat = KATEGORI_BY_SLUG.get(slug);
    const m = metrikKecepatan(times, kat?.targetDetik ?? 60);
    return { slug, nama: kat?.nama || slug, ...m };
  });

  return { akurasiMapel, kategoriRekap };
}
