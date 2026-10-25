import type { Item, Mapel } from './schema.ts';
import { KATEGORI, KATEGORI_BY_SLUG } from './taxonomy.ts';
import { targetDetikDariMapel } from './schema.ts';

export interface ValidationError {
  id?: string;
  file?: string;
  rule: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

const GENERIC_PHRASES = ['sudah jelas', 'semua benar', 'karena itu', 'jawabannya', 'pilihan yang benar'];

function hashStem(item: Item): string {
  const stem = (item.soal || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
  // FNV-1a 32-bit — cukup untuk deteksi stem duplikat, tanpa dependensi Node
  let h = 0x811c9dc5;
  for (let i = 0; i < stem.length; i++) {
    h ^= stem.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function validateItem(item: Item, file?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const base = { id: item.id, file };

  // 1. kunci ada di pilihan
  if (!item.pilihan.some((p) => p.kode === item.kunci)) {
    errors.push({ ...base, rule: 'kunci', message: `Kunci ${item.kunci} tidak ada di pilihan` });
  }

  // 2. Kode pilihan unik dan berurutan dari A
  const kodes = item.pilihan.map((p) => p.kode);
  const unique = new Set(kodes);
  if (unique.size !== kodes.length) {
    errors.push({ ...base, rule: 'pilihan', message: 'Kode pilihan duplikat' });
  }
  const expected = ['A', 'B', 'C', 'D', 'E'].slice(0, kodes.length);
  if (kodes.join(',') !== expected.join(',')) {
    errors.push({ ...base, rule: 'pilihan', message: `Kode pilihan harus berurutan A-${expected[expected.length - 1]}` });
  }

  // 3. kategori milik mapel yang sama
  const kat = KATEGORI_BY_SLUG.get(item.kategori);
  if (kat && kat.mapel !== item.mapel) {
    errors.push({ ...base, rule: 'kategori', message: `Kategori ${item.kategori} bukan untuk mapel ${item.mapel}` });
  }

  // 4. subkategori di whitelist
  if (kat && !kat.subkategori.includes(item.subkategori)) {
    errors.push({ ...base, rule: 'subkategori', message: `Subkategori "${item.subkategori}" tidak ada di whitelist ${item.kategori}` });
  }

  // 5. targetDetik dalam 0.7x–1.5x target mapel
  const targetMapel = targetDetikDariMapel(item.mapel);
  if (item.targetDetik < targetMapel * 0.7 || item.targetDetik > targetMapel * 1.5) {
    errors.push({ ...base, rule: 'targetDetik', message: `targetDetik ${item.targetDetik} di luar rentang ${Math.round(targetMapel * 0.7)}–${Math.round(targetMapel * 1.5)}` });
  }

  // 6. butir prediksi wajib C4+ dan >=2 langkah dan punya stimulus
  if (item.asal === 'prediksi') {
    const level = parseInt(item.kognitif.slice(1), 10);
    if (level < 4) {
      errors.push({ ...base, rule: 'kognitif', message: 'Butir prediksi wajib kognitif C4 atau lebih tinggi' });
    }
    if (item.pembahasan.langkah.length < 2) {
      errors.push({ ...base, rule: 'langkah', message: 'Butir prediksi wajib memiliki minimal 2 langkah pembahasan' });
    }
    if (!item.stimulus?.teks && !item.stimulus?.gambar) {
      errors.push({ ...base, rule: 'stimulus', message: 'Butir prediksi wajib memiliki stimulus teks atau gambar' });
    }
  }

  // 7. butir naskah/rekonstruksi wajib punya tahun dan sumber
  if (item.asal === 'naskah' || item.asal === 'rekonstruksi') {
    if (!item.tahun) {
      errors.push({ ...base, rule: 'tahun', message: `Butir ${item.asal} wajib memiliki tahun` });
    }
    if (!item.sumber || item.sumber.length < 5) {
      errors.push({ ...base, rule: 'sumber', message: `Butir ${item.asal} wajib memiliki sumber` });
    }
  }

  // 8. pembahasan tidak generik
  const pbLower = `${item.pembahasan.inti} ${item.pembahasan.jebakan}`.toLowerCase();
  for (const phrase of GENERIC_PHRASES) {
    if (pbLower.includes(phrase)) {
      errors.push({ ...base, rule: 'pembahasan', message: `Pembahasan mengandung frasa generik "${phrase}"` });
    }
  }

  // 9. minimal 3 pengecoh berbeda makna
  const distractors = item.pilihan.filter((p) => p.kode !== item.kunci).map((p) => p.teks.trim().toLowerCase());
  const distinct = new Set(distractors);
  if (distinct.size < 3) {
    errors.push({ ...base, rule: 'pengecoh', message: 'Minimal 3 pengecoh memiliki makna berbeda' });
  }

  return errors;
}

export function validateBank(items: Item[], file?: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const stems = new Map<string, string>();

  for (const item of items) {
    errors.push(...validateItem(item, file));

    // 9. tidak ada duplikat hash stem
    const h = hashStem(item);
    if (stems.has(h)) {
      errors.push({ id: item.id, file, rule: 'duplikat', message: `Stem soal mirip dengan ${stems.get(h)}` });
    } else {
      stems.set(h, item.id);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateCategoryCounts(items: Item[]): ValidationResult {
  const errors: ValidationError[] = [];
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.kategori, (counts.get(item.kategori) || 0) + 1);
  }
  for (const kat of KATEGORI) {
    const n = counts.get(kat.slug) || 0;
    if (n < 4) {
      errors.push({ rule: 'minimum-kategori', message: `Kategori ${kat.slug} hanya memiliki ${n} butir (minimum 4)` });
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

export function mapelDariKategori(slug: string): Mapel | undefined {
  return KATEGORI_BY_SLUG.get(slug)?.mapel;
}
