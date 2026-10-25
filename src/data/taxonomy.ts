export type Mapel = 'matematika' | 'ipa' | 'bindo' | 'bing';

export interface Kategori {
  slug: string;
  mapel: Mapel;
  nama: string;
  prioritas: 'P1' | 'P2' | 'P3';
  menitMingguan: number;
  targetDetik: number;
  grup?: 'Fisika' | 'Kimia' | 'Biologi';
  subkategori: string[];
}

export const MAPEL_META = {
  matematika: { nama: 'Matematika', kode: 'MAT', targetDetik: 70, targetAkurasi: 72, soalAcuan: 30, menitPadat: 35 },
  ipa: { nama: 'IPA', kode: 'IPA', targetDetik: 45, targetAkurasi: 70, soalAcuan: 40, menitPadat: 30 },
  bindo: { nama: 'Bahasa Indonesia', kode: 'BIN', targetDetik: 30, targetAkurasi: 80, soalAcuan: 40, menitPadat: 20 },
  bing: { nama: 'Bahasa Inggris', kode: 'BIG', targetDetik: 34, targetAkurasi: 75, soalAcuan: 35, menitPadat: 20 },
} as const;

export const KATEGORI: Kategori[] = [
  // Matematika
  {
    slug: 'mat-aljabar',
    mapel: 'matematika',
    nama: 'Aljabar',
    prioritas: 'P1',
    menitMingguan: 75,
    targetDetik: 70,
    subkategori: ['persamaan', 'pertidaksamaan', 'sistem-persamaan', 'fungsi', 'barisan-deret', 'matriks', 'eksponen-logaritma'],
  },
  {
    slug: 'mat-geometri',
    mapel: 'matematika',
    nama: 'Geometri',
    prioritas: 'P1',
    menitMingguan: 60,
    targetDetik: 70,
    subkategori: ['bangun-datar', 'bangun-ruang', 'pythagoras', 'kesebangunan', 'lingkaran', 'garis-sudut', 'transformasi'],
  },
  {
    slug: 'mat-kombinatorika',
    mapel: 'matematika',
    nama: 'Kombinatorika & Peluang',
    prioritas: 'P2',
    menitMingguan: 40,
    targetDetik: 70,
    subkategori: ['kaidah-pencacahan', 'permutasi', 'kombinasi', 'peluang', 'statistika'],
  },
  {
    slug: 'mat-teori-bilangan',
    mapel: 'matematika',
    nama: 'Teori Bilangan',
    prioritas: 'P2',
    menitMingguan: 35,
    targetDetik: 70,
    subkategori: ['faktor-persekutuan', 'kelipatan', 'modulo', 'bilangan-prima', 'pola-bilangan'],
  },
  // Fisika
  {
    slug: 'ipa-gaya',
    mapel: 'ipa',
    nama: 'Fisika: Gaya & Gerak',
    prioritas: 'P1',
    menitMingguan: 14,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['hukum-newton', 'gerak-lurus', 'gerak-melingkar', 'momen-gaya', 'titik-berat'],
  },
  {
    slug: 'ipa-energetika',
    mapel: 'ipa',
    nama: 'Fisika: Energetika',
    prioritas: 'P1',
    menitMingguan: 12,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['usaha-energi', 'hukum-kekekalan-energi', 'daya', 'efisiensi'],
  },
  {
    slug: 'ipa-rangkaian',
    mapel: 'ipa',
    nama: 'Fisika: Rangkaian Listrik',
    prioritas: 'P1',
    menitMingguan: 10,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['rangkaian-seri', 'rangkaian-paralel', 'hukum-ohm', 'daya-listrik', 'arus-tegangan'],
  },
  {
    slug: 'ipa-kalor',
    mapel: 'ipa',
    nama: 'Fisika: Kalor',
    prioritas: 'P2',
    menitMingguan: 9,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['perpindahan-kalor', 'perubahan-wujud', 'kalor-jenis', 'pemuajan'],
  },
  {
    slug: 'ipa-fluida',
    mapel: 'ipa',
    nama: 'Fisika: Fluida',
    prioritas: 'P2',
    menitMingguan: 9,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['tekanan', 'hukum-pascal', 'archimedes', 'aliran-fluida'],
  },
  {
    slug: 'ipa-gelombang',
    mapel: 'ipa',
    nama: 'Fisika: Gelombang',
    prioritas: 'P2',
    menitMingguan: 8,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['gelombang-mekanik', 'gelombang-bunyi', 'cepat-rambat', 'frekuensi-perioda'],
  },
  {
    slug: 'ipa-optik',
    mapel: 'ipa',
    nama: 'Fisika: Optik',
    prioritas: 'P3',
    menitMingguan: 6,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['pemantulan', 'pembiasan', 'lensa', 'cermin', 'mata'],
  },
  {
    slug: 'ipa-elektromagnet',
    mapel: 'ipa',
    nama: 'Fisika: Elektromagnet',
    prioritas: 'P3',
    menitMingguan: 4,
    targetDetik: 45,
    grup: 'Fisika',
    subkategori: ['medan-magnet', 'induksi-elektromagnetik', 'gaya-lorentz', 'transformator'],
  },
  // Kimia
  {
    slug: 'ipa-unsur',
    mapel: 'ipa',
    nama: 'Kimia: Unsur & Senyawa',
    prioritas: 'P1',
    menitMingguan: 14,
    targetDetik: 45,
    grup: 'Kimia',
    subkategori: ['tabel-periodik', 'ikatan-kimia', 'persamaan-reaksi', 'stoikiometri', 'larutan'],
  },
  {
    slug: 'ipa-terapan',
    mapel: 'ipa',
    nama: 'Kimia: Terapan',
    prioritas: 'P2',
    menitMingguan: 14,
    targetDetik: 45,
    grup: 'Kimia',
    subkategori: ['asam-basa', 'elektrolisis', 'korosi', 'polimer', 'kimia-lingkungan'],
  },
  // Biologi
  {
    slug: 'ipa-ekologi',
    mapel: 'ipa',
    nama: 'Biologi: Ekologi',
    prioritas: 'P1',
    menitMingguan: 16,
    targetDetik: 45,
    grup: 'Biologi',
    subkategori: ['ekosistem', 'rantai-makanan', 'siklus-biogeokimia', 'pencemaran', 'keanekaragaman'],
  },
  {
    slug: 'ipa-genetika',
    mapel: 'ipa',
    nama: 'Biologi: Genetika',
    prioritas: 'P1',
    menitMingguan: 14,
    targetDetik: 45,
    grup: 'Biologi',
    subkategori: ['dna-rna', 'pewarisan-sifat', 'mutasi', 'rekayasa-genetika'],
  },
  {
    slug: 'ipa-fisiologi',
    mapel: 'ipa',
    nama: 'Biologi: Fisiologi Manusia',
    prioritas: 'P1',
    menitMingguan: 14,
    targetDetik: 45,
    grup: 'Biologi',
    subkategori: ['pencernaan', 'pernapasan', 'peredaran-darah', 'sistem-saraf', 'hormon'],
  },
  {
    slug: 'ipa-botani',
    mapel: 'ipa',
    nama: 'Biologi: Botani',
    prioritas: 'P2',
    menitMingguan: 14,
    targetDetik: 45,
    grup: 'Biologi',
    subkategori: ['jaringan-tumbuhan', 'fotosintesis', 'reproduksi-tumbuhan', 'pertumbuhan'],
  },
  {
    slug: 'ipa-ciri-kehidupan',
    mapel: 'ipa',
    nama: 'Biologi: Ciri Kehidupan',
    prioritas: 'P2',
    menitMingguan: 12,
    targetDetik: 45,
    grup: 'Biologi',
    subkategori: ['sel', 'metabolisme', 'homeostasis', 'adaptasi', 'klasifikasi'],
  },
  {
    slug: 'ipa-bioteknologi',
    mapel: 'ipa',
    nama: 'Biologi: Bioteknologi',
    prioritas: 'P3',
    menitMingguan: 10,
    targetDetik: 45,
    grup: 'Biologi',
    subkategori: ['bioteknologi-modern', 'bioteknologi-tradisional', 'pangan', 'kesehatan'],
  },
  // Bahasa Indonesia
  {
    slug: 'bindo-membaca',
    mapel: 'bindo',
    nama: 'Bahasa Indonesia: Membaca',
    prioritas: 'P1',
    menitMingguan: 35,
    targetDetik: 30,
    subkategori: ['pemahaman-tekstual', 'ide-pokok', 'simpulan', 'interpretasi', 'analisis-struktur-teks'],
  },
  {
    slug: 'bindo-menyunting',
    mapel: 'bindo',
    nama: 'Bahasa Indonesia: Menyunting',
    prioritas: 'P1',
    menitMingguan: 30,
    targetDetik: 30,
    subkategori: ['ejaan', 'tanda-baca', 'pilihan-kata', 'kalimat-efektif', 'paragraf'],
  },
  {
    slug: 'bindo-struktur',
    mapel: 'bindo',
    nama: 'Bahasa Indonesia: Struktur Bahasa',
    prioritas: 'P2',
    menitMingguan: 15,
    targetDetik: 30,
    subkategori: ['morfologi', 'sintaksis', 'frasa-klausa-kalimat', 'kata-bantu'],
  },
  {
    slug: 'bindo-kosakata',
    mapel: 'bindo',
    nama: 'Bahasa Indonesia: Kosakata',
    prioritas: 'P3',
    menitMingguan: 10,
    targetDetik: 30,
    subkategori: ['antonim', 'sinonim', 'padanan-kata', 'peribahasa'],
  },
  // Bahasa Inggris
  {
    slug: 'bing-reading',
    mapel: 'bing',
    nama: 'Bahasa Inggris: Reading',
    prioritas: 'P1',
    menitMingguan: 55,
    targetDetik: 34,
    subkategori: ['reading-comprehension', 'main-idea', 'inference', 'detail', 'vocabulary-in-context'],
  },
  {
    slug: 'bing-grammar',
    mapel: 'bing',
    nama: 'Bahasa Inggris: Grammar',
    prioritas: 'P1',
    menitMingguan: 40,
    targetDetik: 34,
    subkategori: ['tenses', 'conditional', 'passive-voice', 'reported-speech', 'question-tags'],
  },
  {
    slug: 'bing-vocabulary',
    mapel: 'bing',
    nama: 'Bahasa Inggris: Vocabulary',
    prioritas: 'P2',
    menitMingguan: 25,
    targetDetik: 34,
    subkategori: ['synonyms', 'antonyms', 'word-formation', 'collocations', 'phrasal-verbs'],
  },
];

export const KATEGORI_SLUGS = KATEGORI.map((k) => k.slug);
export const KATEGORI_BY_SLUG = new Map(KATEGORI.map((k) => [k.slug, k]));

export function kategoriUntukMapel(mapel: Mapel): Kategori[] {
  return KATEGORI.filter((k) => k.mapel === mapel);
}

export function targetDetikMapel(mapel: Mapel): number {
  return MAPEL_META[mapel].targetDetik;
}
