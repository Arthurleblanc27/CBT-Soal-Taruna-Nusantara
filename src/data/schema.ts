import { z } from 'zod';
import { KATEGORI, MAPEL_META } from './taxonomy.ts';

export const MapelSchema = z.enum(['matematika', 'ipa', 'bindo', 'bing']);
export type Mapel = z.infer<typeof MapelSchema>;

export const KATEGORI_SLUGS = KATEGORI.map((k) => k.slug) as [string, ...string[]];
export const KategoriSlugSchema = z.enum(KATEGORI_SLUGS);
export type KategoriSlug = z.infer<typeof KategoriSlugSchema>;

const KodePilihanSchema = z.enum(['A', 'B', 'C', 'D', 'E']);

export const PilihanSchema = z.object({
  kode: KodePilihanSchema,
  teks: z.string().min(1),
});

export const ItemSchema = z.object({
  id: z.string().regex(/^(MAT|IPA|BIN|BIG)-[A-Z0-9-]+-\d{3}$/),
  mapel: MapelSchema,
  kategori: KategoriSlugSchema,
  subkategori: z.string(),

  asal: z.enum(['naskah', 'rekonstruksi', 'prediksi']),
  tahun: z.number().int().min(2018).max(2026).optional(),
  sumber: z.string().optional(),
  kognitif: z.enum(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']),

  tingkat: z.enum(['mudah', 'sedang', 'sulit']),
  stimulus: z
    .object({
      teks: z.string().optional(),
      gambar: z.string().optional(),
      alt: z.string().optional(),
    })
    .optional(),

  soal: z.string().min(10),
  pilihan: z.array(PilihanSchema).min(4).max(5),
  kunci: KodePilihanSchema,

  pembahasan: z.object({
    inti: z.string().min(30),
    langkah: z.array(z.string().min(15)).min(1),
    jebakan: z.string().min(30),
    cepat: z.string().optional(),
  }),

  targetDetik: z.number().int().min(15).max(300),
  tags: z.array(z.string()).default([]),
});

export type Item = z.infer<typeof ItemSchema>;

export const BankManifestSchema = z.object({
  versi: z.string(),
  dibuat: z.string().datetime(),
  file: z.array(
    z.object({
      path: z.string(),
      mapel: MapelSchema,
      kategori: KategoriSlugSchema,
      jumlah: z.number().int().min(0),
      hash: z.string().optional(),
    })
  ),
});

export type BankManifest = z.infer<typeof BankManifestSchema>;

export function targetDetikDariMapel(mapel: Mapel): number {
  return MAPEL_META[mapel].targetDetik;
}
