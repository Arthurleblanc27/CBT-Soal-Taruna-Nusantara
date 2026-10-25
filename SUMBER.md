# Registry sumber naskah

Status audit: **belum diverifikasi terhadap naskah asli**. Tabel ini adalah kerangka kerja,
bukan klaim bahwa naskah 2021–2026 tersedia. Isi baris hanya setelah dokumen benar-benar ditemukan
dan diperiksa.

Aturan pemakaian:

- `milik bimbel` → **tidak dipakai** di bank.
- `rekonstruksi` → dipakai dengan label "rekonstruksi peserta" di UI.
- `resmi` / `beredar` → butir menyimpan `tahun` dan `sumber` yang bisa dilacak.

## Tabel audit

| Tahun | Mapel | Jumlah butir | Bentuk | Asal | Status | Izin pakai | Catatan |
|---|---|---|---|---|---|---|---|
| 2026 | — | — | — | — | — | — | Belum ditemukan |
| 2025 | — | — | — | — | — | — | Belum ditemukan |
| 2024 | — | — | — | — | — | — | Belum ditemukan |
| 2023 | — | — | — | — | — | — | Belum ditemukan |
| 2022 | — | — | — | — | — | — | Belum ditemukan |
| 2021 | — | — | — | — | — | — | Belum ditemukan |
| 2018 | — | — | — | — | — | — | Naskah lama yang beredar umum |

## Siklus terbaru (per Oktober 2026)

Pencarian dokumen resmi menemukan bahwa siklus bergerak ke **TN38 / TA 2027/2028** (pendaftaran dan
Pedoman Pensisru 2027/2028 sudah terbit), sedangkan **panduan CBT yang bisa dibaca publik masih
Selmik 1 TN37** (`id.scribd.com/document/958021494`, materi 27 kategori, 105 menit, empat blok).
Tidak ada naskah seleksi TN37/TN38 yang diterbitkan atau beredar.

Karena itu bank disesuaikan dengan **kisi-kisi TN37 sebagai blueprint terbaru yang dapat diverifikasi**:
12 kategori IPA yang sebelumnya kosong kini terisi satu butir (gaya, kalor, fluida, gelombang, optik,
elektromagnet, unsur, terapan, fisiologi, botani, ciri kehidupan, bioteknologi), ditambah butir membaca,
struktur, serta reading/grammar/vocabulary. Total bank menjadi **48 butir** dan tiga paket dirombak
menjadi 12 butir per paket dengan komposisi empat mapel yang lebih merata.

Butir 2018 tetap disimpan dan diberi label `naskah` (bukan diganti) karena itu satu-satunya sumber
yang dapat dilacak; butir baru berlabel `prediksi` dengan `kognitif` C4-C5.

## Konsekuensi untuk bank

Karena audit belum menghasilkan naskah, **seluruh butir contoh saat ini berlabel `prediksi`**
dan wajib memenuhi standar HOTS:

- `kognitif` C4 / C5 / C6
- minimal 2 langkah penyelesaian
- punya stimulus teks atau gambar
- pengecoh mewakili miskonsepsi nyata

Jumlah butir nyata akan menggantikan angka target di rencana hanya setelah audit selesai.
Aplikasi tidak boleh menampilkan butir sebagai "naskah asli" tanpa bukti di tabel ini.

## Cara mengisi

1. Cari naskah lewat arsip resmi, dokumen peserta, atau kiriman pengguna.
2. Catat tahun · mapel · jumlah butir yang benar-benar terlihat · bentuk file · asal.
3. Tentukan status dan izin pakai.
4. Salin butir ke `public/bank/<kategori>.json` dengan `asal`, `tahun`, dan `sumber` terisi.
5. Jalankan `npm run validate` lalu `npm run bank`.
