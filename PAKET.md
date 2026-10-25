# Empat paket soal TN Trainer

Empat paket berisi **48 butir unik tanpa duplikat** — setiap butir hanya muncul di satu paket, jadi
keempatnya bisa dikerjakan berurutan tanpa soal berulang. Bank total saat ini 66 butir.

| | Paket 1 — Fondasi Naskah 2018 | Paket 2 — Seleksi Campuran | Paket 3 — Simulasi HOTS | Paket 4 — Uji Coba Baru |
|---|---|---|---|
| Fokus | pola butir panitia + pemahaman dasar | komposisi satu sesi seleksi | penalaran C4–C5 dan kecepatan |
| Butir | 12 | 12 | 12 |
| Naskah 2018 | **6** | 3 | 2 |
| Prediksi | 6 | 9 | 10 |
| Matematika | 6 | 4 | 4 |
| IPA | 2 | 3 | 3 |
| B. Indonesia | 2 | 3 | 2 |
| B. Inggris | 2 | 2 | 3 |
| Target waktu | ±10 menit | ±11 menit | ±11 menit |
| Berkas | satu berkas untuk ketiganya |→ |→ |

Semua paket berada dalam **satu berkas**: `public/paket/paket-tn-trainer.json`
(properti `paket[0]`, `paket[1]`, `paket[2]`; ditambah `jumlahPaket`, `jumlahButirUnik`, `sumberUtama`).

## Sumber tiap butir

### Naskah asli 2018 — 11 butir
Semua berasal dari satu dokumen yang bisa dilacak:
*Salinan Soal Seleksi Akademik Calon Siswa SMA Taruna Nusantara 2018 — Matematika* (30 soal pilihan
ganda, 11 halaman), `id.scribd.com/document/551952903`.

| Butir | Nomor asli | Kategori | Paket |
|---|---|---|---|
| MAT-ALJ-003 | no. 2 — relasi yang merupakan pemetaan | mat-aljabar | 1 |
| MAT-ALJ-004 | no. 4 — model SPLDV belanja buah | mat-aljabar | 1 |
| MAT-GEO-002 | no. 7 — jenis segitiga 12-16-19 | mat-geometri | 1 |
| MAT-GEO-003 | no. 10 — banyak rusuk prisma segilima | mat-geometri | 1 |
| MAT-KOM-002 | no. 16 — regu campuran 4 putra 5 putri | mat-kombinatorika | 1 |
| MAT-KOM-003 | no. 17 — ruang sampel uang logam dan dadu | mat-kombinatorika | 1 |
| MAT-ALJ-005 | no. 5 — f(2x+3), nilai f(0) + f(1) | mat-aljabar | 2 |
| MAT-KOM-001 | no. 15 — inklusi-eksklusi tiga kegiatan | mat-kombinatorika | 2 |
| MAT-ALJ-006 | no. 6 — pembagian suku banyak, 2a − b | mat-aljabar | 2 |
| MAT-ALJ-007 | no. 23 — deret aritmetika kursi gedung | mat-aljabar | 3 |
| MAT-KOM-004 | no. 19 — rata-rata tiga nilai ulangan | mat-kombinatorika | 3 |

Teks soal ditulis ulang dari naskah dengan ejaan dirapikan; angka, pilihan, dan kunci tidak diubah.
Setiap butir menyimpan `tahun: 2018` dan `sumber` berisi URL + nomor butir.

### Prediksi HOTS — 37 butir
Butir baru, **bukan** soal panitia. Disusun mengikuti kisi-kisi resmi *Panduan CBT Selmik 1 TN37*
(27 kategori: Matematika 4 · Fisika 8 · Kimia 2 · Biologi 6 · B. Indonesia 4 · B. Inggris 3)
dan pola butir naskah 2018. Semua berlabel `asal: "prediksi"`, `kognitif` C4–C5, minimal dua
langkah penyelesaian, dan berstimulus teks.

| Mapel | Butir | Sebaran kategori |
|---|---|---|
| Matematika | 5 | aljabar 2 · geometri 1 · teori bilangan 2 |
| IPA | 16 | satu butir untuk **setiap** kategori: gaya · energetika · rangkaian · kalor · fluida · gelombang · optik · elektromagnet · unsur · terapan · ekologi · genetika · fisiologi · botani · ciri kehidupan · bioteknologi |
| B. Indonesia | 9 | membaca 3 · menyunting 2 · struktur 2 · kosakata 2 |
| B. Inggris | 7 | reading 3 · grammar 2 · vocabulary 2 |

Butir IPA yang baru ditambahkan pada penyesuaian terakhir: gaya (lift, 720 N), kalor (84 kJ → 240 s),
fluida (kayu 750 kg/m³), gelombang (λ 16 cm), optik (perbesaran 2×), elektromagnet (trafo 5 A),
unsur (0,896 L CO₂), terapan (korosi air garam), fisiologi (sistol/diastol), botani (data Ingenhousz),
ciri kehidupan (homeostasis), bioteknologi (insulin rekombinan).

Pemetaan butir → paket tidak lagi ditulis manual di sini; sumber kebenarannya ada di properti
`daftarSumber` pada `public/paket/paket-tn-trainer.json`.

## Bentuk berkas dan cara memakainya

```jsonc
{
  "versi": "2026-10-19",
  "judul": "Bank Soal TN Trainer - 3 Paket Latihan",
  "sumberUtama": { "naskah": "...", "url": "...", "kisiKisi": "..." },
  "jumlahPaket": 3,
  "jumlahButirUnik": 36,
  "paket": [
    {
      "id": "paket-1",
      "nama": "Paket 1 - Fondasi Naskah 2018",
      "jumlah": 10,
      "targetMenit": 8,
      "komposisi": { "matematika": 6, "bindo": 1, "ipa": 2, "bing": 1 },
      "jumlahNaskah": 6,
      "jumlahPrediksi": 4,
      "ids": ["MAT-ALJ-003", "..."],   // rujukan ke butir di public/bank
      "daftarSumber": [{ "id": "...", "asal": "naskah", "tahun": 2018, "sumber": "..." }],
      "butir": [ /* butir lengkap, siap render tanpa mengambil bank lagi */ ]
    }
    // paket-2, paket-3 dengan bentuk sama
  ]
}
```

- Berkas paket sengaja ditaruh di `public/paket/`, **bukan** `public/bank/`, agar tidak mengubah
  manifest bank dan tidak bentrok dengan loader per kategori.
- Karena `butir` sudah lengkap di dalam berkas, satu `fetch('/paket/paket-tn-trainer.json')` cukup
  untuk menjalankan sesi mana pun: pilih `paket[n]` lalu pakai `paket[n].butir`. `ids` dipakai bila
  aplikasi ingin mengambil butir dari bank (misalnya untuk berbagi cache atau menandai progres per butir).
- Butir bergambar memakai berkas yang sudah ada: `/img/mat-geometri-01.svg` dan
  `/img/ipa-rangkaian-01.svg`.

## Halaman web

| Route | Isi |
|---|---|
| `/paket` | daftar tiga paket terpisah: komposisi, jumlah naskah/prediksi, target waktu |
| `/paket/paket-1` | briefing paket 1 + tombol **Mulai dengan timer** dan **Latihan tanpa timer** |
| `/paket/paket-2` | idem untuk paket 2 |
| `/paket/paket-3` | idem untuk paket 3 |

Kode: `src/lib/paket.ts` (loader), `src/components/paket/PaketList.tsx`,
`src/components/paket/PaketRunner.tsx`, `src/pages/paket/index.astro`,
`src/pages/paket/[id].astro`. Menu **Paket** ada di navigasi atas.
Timer memakai `targetMenit` paket (480/600/600 detik) dan satu sesi per paket, jadi hasil ketiganya terpisah.

## Cek integrasi

```bash
npm run build
npm run preview            # server lokal di :4321
node scripts/check-integrasi.mjs   # semua route + semua mode + paket sampai halaman hasil
node scripts/check-keyboard.mjs    # jawab 10 butir pakai A-E + panah, cek nilai jawaban
node scripts/feature-audit.mjs     # 26 pemeriksaan fitur: belajar/cepat/simulasi/paket/bank/hasil/analitik/responsif
```

`feature-audit.mjs` mencakup: semua route 200, pembahasan langsung, lanjut antrean belajar, countdown cepat,
ragu (F), dialog keluar (Esc), 4 blok padat-105, pemulihan sesi setelah reload, penutupan otomatis saat waktu habis,
muat ulang & ekspor & impor bank, tombol cetak hasil, analitik, serta tidak ada luapan horizontal di 390 px.

Perbaikan yang lahir dari audit ini:

- Sesi yang waktunya sudah habis ditutup otomatis saat halaman dibuka lagi (`src/lib/recovery.ts`) dan hasilnya disimpan.
- Sesi simulasi dan sesi paket kini menawarkan **Lanjutkan sesi** setelah reload (sebelumnya hanya belajar/cepat).
- Enter pada tombol opsi tidak lagi diabaikan, sehingga alur jawab → lanjut terasa wajar.
- `ambilHasil()` memvalidasi bentuk data; `?id=list` atau id rusak menampilkan keadaan kosong, bukan halaman blank.
- Keadaan kosong halaman hasil diberi penjelasan dan dua jalan keluar (Paket 1 / Analitik).
- `?debug=1` tidak pernah aktif karena situs statis (nilainya dibaca saat build). Kini dibaca di klien, jadi
  blok padat-105 menjadi 30 detik dan protokol 70/30 bisa diuji tanpa menunggu 25 menit.
- Protokol 70/30 sebelumnya hanya menampilkan pesan; sekarang benar-benar mengubah `sesi.putaran` menjadi 2.

Dua bug yang ditemukan lewat cek ini dan sudah diperbaiki:

1. `SessionLauncher` menonaktifkan tombol mulai bila jumlah butir yang diminta (default 15) melebihi isi bank
   per mapel — IPA/BIng 4 butir, BIndo 6. Kini jumlah dipotong ke isi pool (`jumlahEfektif`).
2. `ExamRunner` membandingkan `e.key >= 'a'`, sehingga `ArrowRight`, `Enter`, `Escape`, dan `F5` tertangkap
   sebagai jawaban A-E: butir tidak berpindah dan `jawaban` terisi nilai seperti `"ArrowRight"`. Kini navigasi
   diperiksa lebih dahulu dan huruf diuji dengan `/^[a-eA-E]$/`.

## Verifikasi

```bash
npm run validate   # 30 butir bank, 0 error
npm run paket      # 3 paket dalam 1 berkas, 30 butir unik, 0 error, tanpa duplikat antar paket
```

Hasil terakhir:

```
paket-tn-trainer.json: 3 paket
  paket-1: 10 butir | naskah 6 | prediksi 4 | MAT 6 IPA 2 BIN 1 BIG 1 | ±8 menit
  paket-2: 10 butir | naskah 3 | prediksi 7 | MAT 5 IPA 1 BIN 3 BIG 1 | ±10 menit
  paket-3: 10 butir | naskah 2 | prediksi 8 | MAT 5 IPA 1 BIN 2 BIG 2 | ±10 menit
Total butir pada paket: 30 | butir unik: 30
Semua paket lolos validasi.
```

## Yang perlu diketahui

- Naskah seleksi akademik **2021–2026 tidak diterbitkan panitia dan tidak beredar**; yang ada hanya
  naskah 2018 (dan 2007/2008 berupa pindaian tanpa lapisan teks). Karena itu paket 1 hanya memuat
  butir Matematika: satu-satunya mapel dengan naskah asli terbaca.
- Paket 1–3 belum menutup semua 27 kategori. Kategori yang masih kosong: seluruh Fisika selain gaya
  tidak lengkap, Kimia (unsur/terapan), Biologi fisiologi/botani/ciri-kehidupan/bioteknologi,
  serta B. Indonesia bagian membaca baru satu butir.
