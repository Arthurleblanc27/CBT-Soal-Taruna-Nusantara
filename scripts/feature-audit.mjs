import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();

const hasil = [];
const gagal = [];
const ok = (nama, ket = '') => hasil.push(`OK   ${nama}${ket ? ' — ' + ket : ''}`);
const no = (nama, ket = '') => {
  hasil.push(`GAGAL ${nama}${ket ? ' — ' + ket : ''}`);
  gagal.push(`${nama}: ${ket}`);
};
page.on('pageerror', (e) => gagal.push(`pageerror ${page.url()}: ${e.message.slice(0, 160)}`));

const sesi = () => page.evaluate(() => JSON.parse(localStorage.getItem('tntrainer:sesi:aktif') || 'null'));
const teks = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
const bersih = async (url) => {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
};

// ---------- 1. Semua route ----------
const routes = ['/', '/paket', '/paket/paket-1', '/paket/paket-2', '/paket/paket-3', '/paket/paket-4', '/belajar', '/cepat',
  '/belajar/matematika', '/belajar/ipa', '/belajar/bindo', '/belajar/bing',
  '/cepat/matematika', '/cepat/ipa', '/cepat/bindo', '/cepat/bing',
  '/simulasi', '/simulasi/padat-105', '/simulasi/longgar-90', '/bank', '/analitik', '/rencana'];
let routeOk = 0;
for (const r of routes) {
  const resp = await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
  if (resp && resp.status() === 200) routeOk++;
  else no(`route ${r}`, `status ${resp && resp.status()}`);
}
if (routeOk === routes.length) ok('semua route merespons 200', `${routes.length} halaman`);

// ---------- 2. Mode belajar: jawab → pembahasan → lanjut; antrean salah ----------
await bersih('/belajar/matematika');
await page.getByRole('button', { name: /Mulai sesi/i }).click();
await page.waitForTimeout(800);
let s = await sesi();
if (!s) no('belajar mulai', 'sesi kosong');
else {
  const jumlahAwal = s.daftarItem.length;
  // jawab salah dengan sengaja: pilih opsi yang bukan kunci item pertama
  const kunci = await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('tntrainer:sesi:aktif')).daftarItem[0];
    return id;
  });
  const radios = page.getByRole('radio');
  await radios.nth(2).click();
  await page.waitForTimeout(500);
  const t = await teks();
  const autoPembahasan = /Jebakan|Langkah|Trik cepat/i.test(t);
  !autoPembahasan
    ? ok('belajar: koreksi tidak muncul otomatis setelah menjawab')
    : no('belajar: koreksi bocor', 'pembahasan tampil tanpa diminta');
  const tombolLihat = page.getByRole('button', { name: /Lihat pembahasan/i }).first();
  if (await tombolLihat.count()) {
    await tombolLihat.click();
    await page.waitForTimeout(600);
    /Jebakan|Langkah/i.test(await teks())
      ? ok('belajar: pembahasan muncul setelah diminta')
      : no('belajar: pembahasan', 'tidak muncul setelah diklik');
  } else no('belajar: tombol pembahasan', 'tidak ada');
  const soalSebelum = (await page.locator('article').innerText()).slice(0, 160);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const soalSesudah = (await page.locator('article').innerText()).slice(0, 160);
  soalSebelum !== soalSesudah
    ? ok('belajar: Enter lanjut ke butir berikutnya', 'isi soal berubah')
    : no('belajar: lanjut', 'soal tidak berubah setelah Enter');
}

// ---------- 3. Mode cepat: countdown per butir ----------
await bersih('/cepat/matematika');
await page.getByRole('button', { name: /Mulai sesi/i }).click();
await page.waitForTimeout(900);
const t1 = await teks();
const m1 = t1.match(/(\d{2}):(\d{2})/);
await page.waitForTimeout(2200);
const t2 = await teks();
const m2 = t2.match(/(\d{2}):(\d{2})/);
if (m1 && m2 && (Number(m1[1]) * 60 + Number(m1[2])) > (Number(m2[1]) * 60 + Number(m2[2]))) {
  ok('cepat: countdown per butir berjalan', `${m1[0]} → ${m2[0]}`);
} else no('cepat: countdown', `${m1 && m1[0]} → ${m2 && m2[0]}`);
await page.keyboard.press('a');
await page.waitForTimeout(1200);
const setelahJawab = await sesi();
setelahJawab && Object.values(setelahJawab.jawaban).filter(Boolean).length >= 1
  ? ok('cepat: jawaban tercatat')
  : no('cepat: jawaban tidak tercatat');

// ---------- 4. Ragu (F) dan Esc ----------
await page.keyboard.press('f');
await page.waitForTimeout(400);
s = await sesi();
Object.keys(s.ragu || {}).length === 1 ? ok('keyboard F menandai ragu') : no('keyboard F', JSON.stringify(s.ragu));
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
(await teks()).includes('Selesaikan sesi') ? ok('Esc membuka dialog keluar') : no('Esc', 'dialog tidak muncul');
await page.getByRole('button', { name: 'Kembali' }).click();
await page.waitForTimeout(300);

// ---------- 5. Simulasi padat-105: 4 blok + resume setelah reload ----------
await bersih('/simulasi/padat-105');
await page.getByRole('button', { name: /Mulai simulasi/i }).click();
await page.waitForTimeout(900);
s = await sesi();
s && s.blokMapel.length === 4 ? ok('padat-105: 4 blok mapel', `${s.daftarItem.length} butir`) : no('padat-105 blok', String(s && s.blokMapel.length));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const tReload = await teks();
if (/belum selesai|Lanjutkan sesi/i.test(tReload)) {
  await page.getByRole('button', { name: /Lanjutkan sesi/i }).click();
  await page.waitForTimeout(700);
  const s2 = await sesi();
  s2 && s2.daftarItem.length === s.daftarItem.length ? ok('reload: sesi dipulihkan') : no('reload', 'sesi tidak pulih');
} else no('reload', 'banner lanjutkan sesi tidak muncul');

// ---------- 6. Timer habis → auto-submit ----------
await bersih('/paket/paket-2');
await page.getByRole('button', { name: /Mulai dengan timer/i }).click();
await page.waitForTimeout(800);
await page.evaluate(() => {
  const k = 'tntrainer:sesi:aktif';
  const s = JSON.parse(localStorage.getItem(k));
  s.mulai = Date.now() - (s.budgetDetik + 10) * 1000;
  localStorage.setItem(k, JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const urlHabis = page.url();
const hasilTersimpan = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('tntrainer:hasil')).length);
urlHabis.includes('/hasil') && hasilTersimpan >= 1
  ? ok('timer habis: sesi ditutup dan hasil tersimpan', urlHabis.replace(BASE, ''))
  : no('timer habis', `url ${urlHabis.replace(BASE, '')} · hasil ${hasilTersimpan}`);

// ---------- 7. Bank: muat ulang, tabel file, ekspor ----------
await page.goto(BASE + '/bank', { waitUntil: 'networkidle' });
const tBank = await teks();
/muat ulang/i.test(tBank) && /15 file|Butir per kategori/i.test(tBank) ? ok('bank: ringkasan + daftar file tampil') : no('bank', 'ringkasan tidak lengkap');
await page.getByRole('button', { name: /Muat ulang/i }).click();
await page.waitForTimeout(1200);
const totalManifest = await page.evaluate(async () => {
  const m = await (await fetch('/bank/manifest.json?ts=' + Date.now())).json();
  return m.file.reduce((s, f) => s + f.jumlah, 0);
});
(await teks()).includes(`${totalManifest} butir`)
  ? ok('bank: muat ulang berjalan', `${totalManifest} butir`)
  : no('bank muat ulang', `halaman tidak menampilkan ${totalManifest} butir`);
const unduh = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
await page.getByRole('button', { name: /Ekspor bank/i }).click();
const dl = await unduh;
dl ? ok('bank: ekspor menghasilkan berkas', dl.suggestedFilename()) : no('bank: ekspor', 'tidak ada unduhan');

// ---------- 8. Hasil: skor, kategori, cetak ----------
const resId = await page.evaluate(() => {
  const k = Object.keys(localStorage).find((x) => /^tntrainer:hasil:(?!list$)/.test(x));
  return k ? k.split('tntrainer:hasil:')[1] : null;
});
await page.goto(BASE + (resId ? `/hasil?id=${resId}` : '/hasil'), { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const tHasil = await teks();
/skor|benar|akurasi|hasil/i.test(tHasil) ? ok('hasil: halaman menampilkan ringkasan') : no('hasil', tHasil.slice(0, 120));
const cetak = page.getByRole('button', { name: /Cetak/i });
(await cetak.count()) ? ok('hasil: tombol cetak tersedia') : no('hasil: cetak tidak ada');

// ---------- 9. Analitik ----------
await page.goto(BASE + '/analitik', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const tAn = await teks();
/kategori|akurasi|sesi|belum ada/i.test(tAn) ? ok('analitik: merender data') : no('analitik', tAn.slice(0, 120));

// ---------- 10. Responsif 390px ----------
const mobile = await ctx.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
for (const r of ['/', '/paket', '/belajar/matematika', '/bank']) {
  await mobile.goto(BASE + r, { waitUntil: 'networkidle' });
  const lebar = await mobile.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  if (lebar.sw <= lebar.iw + 2) ok(`responsif ${r}`, `${lebar.sw}px`);
  else no(`responsif ${r}`, `scrollWidth ${lebar.sw} > ${lebar.iw}`);
}
await mobile.close();

// ---------- 11. Paket tanpa timer (mode belajar) ----------
await bersih('/paket/paket-3');
await page.getByRole('button', { name: /Latihan tanpa timer/i }).click();
await page.waitForTimeout(800);
s = await sesi();
s && s.mode === 'simulasi' && s.daftarItem.length === 12 && s.budgetDetik === 0
  ? ok('paket tanpa timer: sesi ujian 12 butir tanpa countdown')
  : no('paket tanpa timer', s ? `${s.mode}/${s.daftarItem.length}/budget ${s.budgetDetik}` : 'tidak ada sesi');
await page.getByRole('radio').nth(0).click();
await page.waitForTimeout(500);
const tUjian = await teks();
/Inti|Langkah|Jebakan/i.test(tUjian)
  ? no('paket tanpa timer: koreksi bocor', 'pembahasan tampil saat menjawab')
  : ok('paket tanpa timer: tidak ada koreksi sebelum selesai');

// ---------- 12. Belajar: reload lalu lanjutkan, lalu buang ----------
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);
if (/Lanjutkan sesi/i.test(await teks())) {
  await page.getByRole('button', { name: /Lanjutkan sesi/i }).click();
  await page.waitForTimeout(700);
  const s3 = await sesi();
  s3 ? ok('belajar: sesi bertimer nol dipulihkan setelah reload') : no('belajar reload', 'sesi hilang');
} else no('belajar reload', 'banner tidak muncul');

// ---------- 13. Buang sesi aktif ----------
await bersih('/belajar/matematika');
await page.getByRole('button', { name: /Mulai sesi/i }).click();
await page.waitForTimeout(700);
await page.goto(BASE + '/belajar/matematika', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const buang = page.getByRole('button', { name: /^Buang$/ }).first();
if (await buang.count()) {
  await buang.click();
  await page.waitForTimeout(500);
  (await sesi()) === null ? ok('sesi: tombol Buang menghapus sesi aktif') : no('buang sesi', 'sesi masih ada');
} else no('buang sesi', 'tombol tidak ada');

// ---------- 14. Bank: impor JSON dari disk ----------
const tmp = '.shots/uji-impor.json';
await import('node:fs/promises').then((fs) => fs.writeFile(tmp, JSON.stringify([{
  id: 'MAT-ALJ-099', mapel: 'matematika', kategori: 'mat-aljabar', subkategori: 'persamaan',
  asal: 'prediksi', kognitif: 'C4', tingkat: 'mudah',
  stimulus: { teks: 'Uji impor: 2x + 4 = 10.' }, soal: 'Nilai x pada persamaan uji impor adalah ...',
  pilihan: [{ kode: 'A', teks: '2' }, { kode: 'B', teks: '3' }, { kode: 'C', teks: '4' }, { kode: 'D', teks: '5' }],
  kunci: 'B',
  pembahasan: { inti: 'Butir uji impor untuk memastikan berkas dari disk terbaca oleh pengelola bank.', langkah: ['Kurangi 4 dari kedua ruas sehingga 2x = 6.', 'Bagi dua sehingga x = 3.'], jebakan: 'Pilihan 5 muncul bila 10 dibagi dua sebelum 4 dikurangkan.' },
  targetDetik: 60, tags: ['uji'],
}]), 'utf-8'));
await page.goto(BASE + '/bank', { waitUntil: 'networkidle' });
const fileInput = page.locator('input[type=file]').first();
await fileInput.setInputFiles(tmp);
await page.waitForTimeout(1200);
const impor = await page.evaluate(() => JSON.parse(localStorage.getItem('tntrainer:bank:impor') || '[]'));
impor.length === 1 && impor[0].id === 'MAT-ALJ-099' ? ok('bank: impor JSON dari disk') : no('bank impor', `tersimpan ${impor.length}`);

// ---------- 15. Protokol 70/30 di simulasi ----------
await page.goto(BASE + '/simulasi/padat-105', { waitUntil: 'networkidle' });
const tSim = await teks();
/70%|putaran|checkpoint|105/i.test(tSim) ? ok('simulasi: penjelasan checkpoint/protokol tampil') : no('simulasi protokol', 'teks tidak ditemukan');

// ---------- Ringkasan ----------
console.log(hasil.join('\n'));
console.log(`\n=== ${gagal.length} masalah ===`);
for (const g of gagal) console.log('- ' + g);
await browser.close();
process.exit(gagal.length ? 1 : 0);
