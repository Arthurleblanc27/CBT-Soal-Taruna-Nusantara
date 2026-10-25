import type { Item, Mapel } from '@data/schema';

export const PAKET_URL = '/paket/paket-tn-trainer.json';

export interface SumberButir {
  id: string;
  asal: 'naskah' | 'rekonstruksi' | 'prediksi';
  tahun: number | null;
  sumber: string;
}

export interface Paket {
  id: string;
  nama: string;
  deskripsi: string;
  bankVersi: string;
  jumlah: number;
  targetMenit: number;
  komposisi: Partial<Record<Mapel, number>>;
  jumlahNaskah: number;
  jumlahPrediksi: number;
  ids: string[];
  daftarSumber: SumberButir[];
  butir: Item[];
}

export interface DokumenPaket {
  versi: string;
  judul: string;
  catatan: string;
  sumberUtama: { naskah: string; url: string; kisiKisi: string };
  jumlahPaket: number;
  jumlahButirUnik: number;
  paket: Paket[];
}

/** Cek bentuk minimal supaya berkas yang rusak tidak menjatuhkan halaman. */
function sahkan(doc: unknown): doc is DokumenPaket {
  const d = doc as DokumenPaket;
  return !!d && Array.isArray(d.paket) && d.paket.every((p) => Array.isArray(p.butir) && Array.isArray(p.ids));
}

export async function loadPaket(): Promise<{ doc: DokumenPaket | null; error?: string }> {
  try {
    const res = await fetch(`${PAKET_URL}?ts=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!sahkan(data)) throw new Error('bentuk berkas paket tidak dikenali');
    return { doc: data };
  } catch (e) {
    return { doc: null, error: `Paket gagal dimuat: ${(e as Error).message}. Jalankan situs lewat start.bat, bukan file://.` };
  }
}

export function cariPaket(doc: DokumenPaket | null, id: string): Paket | undefined {
  return doc?.paket.find((p) => p.id === id);
}

/** Butir yang benar-benar ada, urut sesuai ids paket. */
export function butirPaket(paket: Paket): Item[] {
  const map = new Map(paket.butir.map((b) => [b.id, b]));
  return paket.ids.map((id) => map.get(id)).filter((x): x is Item => !!x);
}
