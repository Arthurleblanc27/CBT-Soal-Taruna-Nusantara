# TN Trainer

Latihan soal seleksi akademik Taruna Nusantara — lokal, tanpa login, tanpa backend.

Fokus aplikasi: **pemahaman soal** (pembahasan tiga lapis) dan **kecepatan menjawab**
(pengukuran per butir dan per kategori).

---

## Cara menjalankan

Situs harus disajikan lewat server lokal karena bank soal diambil dengan `fetch()`.
Membuka `file://` tidak akan bekerja.

```bash
npm install
npm run validate     # cek bank soal
npm run build        # build produksi
npm run preview      # http://localhost:4321
```

Atau di Windows: klik dua kali `start.bat` — skrip itu menjalankan preview dan membuka browser.

Mode pengembangan:

```bash
npm run dev          # http://localhost:4321 dengan hot reload
```

---

## Empat mode

| Mode | Rute | Timer | Skor |
|---|---|---|---|
| Belajar | `/belajar` → `/belajar/[mapel]` | Stopwatch pasif | Tidak dinilai; butir salah diulang sampai benar 2× berturut. Pembahasan hanya muncul bila tombol **Lihat pembahasan** ditekan |
| Cepat | `/cepat` → `/cepat/[mapel]` | Countdown per butir | Akurasi × kepatuhan waktu |
| Paket | `/paket` → `/paket/[id]` | Bertimer atau tanpa batas | 1 / 0 / 0 tanpa penalti; skor + koreksi muncul otomatis setelah butir terakhir dijawab |
| Simulasi | `/simulasi/padat-105` · `/simulasi/longgar-90` | Countdown global, tidak bisa dijeda | 1 / 0 / 0 tanpa penalti |

`/belajar` dan `/cepat` menampilkan **keempat mata pelajaran** yang diujikan — Matematika, IPA,
Bahasa Indonesia, Bahasa Inggris — lengkap dengan jumlah butir per kategori. Di dalam halaman mapel
ada pemilih mapel (pill) sehingga bisa berpindah tanpa kembali ke daftar.

Halaman pendukung: `/hasil?id=<id>` · `/analitik` · `/rencana` · `/bank`.

### Mode debug simulasi

`/simulasi/padat-105?debug=1` memampatkan setiap blok menjadi 30 detik agar checkpoint bisa
diuji tanpa menunggu 105 menit. Jangan dipakai untuk latihan sungguhan.

---

## Mengganti bank soal tanpa build

Bank saat ini berisi **66 butir** pada 27 file kategori: 11 butir naskah 2018 dan 55 butir prediksi HOTS
yang disusun mengikuti materi resmi Panduan CBT Selmik 1 TN37 (siklus terbaru yang panduannya terbit).
Empat paket memakai 48 dari 66 butir tersebut, 12 butir per paket.

Bank dibaca saat runtime dari `public/bank/` lewat `manifest.json`.

1. Tambah atau ganti file JSON di `public/bank/`.
2. Jalankan `npm run bank` untuk membuat ulang manifest (jumlah + hash).
3. Buka `/bank` lalu tekan **Muat ulang**.

Butir hasil impor dari disk tersimpan di `localStorage` (`tntrainer:bank:impor`) dan bisa
dihapus dari halaman yang sama.

Format satu file bank: array objek butir. Lihat `public/bank/mat-aljabar.json` sebagai contoh.

---

## Validasi bank

```bash
npm run validate
```

Aturan yang ditegakkan:

1. `kunci` ada di `pilihan`; kode pilihan unik dan berurutan dari A.
2. `kategori` cocok dengan `mapel`; `subkategori` ada di whitelist kategori.
3. `targetDetik` dalam 0,7×–1,5× target mapel.
4. Butir `prediksi` wajib `kognitif` ≥ C4, ≥ 2 langkah pembahasan, dan punya stimulus.
5. Butir `naskah`/`rekonstruksi` wajib punya `tahun` dan `sumber`.
6. Pembahasan tidak boleh mengandung frasa generik ("sudah jelas", "semua benar", …).
7. Tidak ada duplikat hash stem; minimal 3 pengecoh berbeda makna.
8. File gambar stimulus harus ada di `public/img/`.

Peringatan jumlah minimum 4 butir per kategori baru menjadi **error** ketika bank mencapai
164 butir (minimum v1).

---

## Struktur

```
src/
├─ data/         taxonomy.ts · schema.ts · validate.ts
├─ lib/          bank · session · sessionStore · scoring · speed · selection · analytics
├─ components/
│  ├─ runner/    ExamRunner · SessionLauncher · QuestionCard · NavGrid · TimerBar
│  ├─ learn/     ExplainPanel
│  ├─ media/     Figure · RichText (KaTeX)
│  ├─ charts/    CategoryBars
│  ├─ bank/      BankManager
│  └─ hasil/     HasilView · analitik/ AnalitikView · home/ HomeStats
├─ layouts/      Base.astro
├─ pages/        index · belajar · cepat · simulasi · hasil · analitik · rencana · bank
└─ styles/       global.css
scripts/         validate-items.mjs · build-manifest.mjs
public/bank/     JSON soal + manifest.json
public/img/      gambar stimulus
```

---

## Catatan teknis

- `astro.config.mjs` memakai `vite.resolve.preserveSymlinks = true` karena proyek berada di
  jalur symlink drive. Tanpa ini build bisa kehilangan CSS tanpa pesan error.
- Timer memakai `Date.now()` untuk kebenaran waktu (bukan akumulasi tick), sehingga tab yang
  di latar belakang tidak memperpanjang waktu.
- Sesi aktif disimpan di `localStorage` dan dipulihkan setelah reload.
- Halaman hasil memakai `/hasil?id=<id>` agar tetap kompatibel dengan build statis.
- Semua data (bank, sesi, hasil) berada di perangkat ini. Tidak ada unggahan jaringan.

Lihat `SUMBER.md` untuk registry sumber naskah dan `IDEA.md` untuk ringkas tujuan produk.
