import { chromium } from '@playwright/test';

const base = process.env.BASE || 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();

const gagal = [];
await page.goto(`${base}/paket/`, { waitUntil: 'networkidle' });
const kartu = await page.locator('article').count();
const judul = await page.locator('h1').first().innerText();
const nama = await page.locator('article h2').allInnerTexts();
console.log('DAFTAR PAKET:', judul, '| kartu:', kartu, '|', nama.join(' / '));
if (kartu < 3) gagal.push(`kartu paket ${kartu}, minimal 3`);

for (const id of ['paket-1', 'paket-2', 'paket-3', 'paket-4']) {
  await page.goto(`${base}/paket/${id}/`, { waitUntil: 'networkidle' });
  const h1 = await page.locator('h1').first().innerText();
  const tombol = await page.getByRole('button', { name: /Mulai dengan timer/i }).count();
  const sumber = await page.locator('li code').count();
  console.log(`${id}: "${h1}" | tombol mulai: ${tombol} | baris sumber: ${sumber}`);
  if (tombol !== 1) gagal.push(`${id}: tombol mulai tidak ada`);
  if (sumber < 5) gagal.push(`${id}: daftar sumber terlalu sedikit (${sumber})`);
}

// Jalankan paket 1: timer mode, pastikan soal dan pilihan muncul
await page.goto(`${base}/paket/paket-1/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Mulai dengan timer/i }).click();
await page.waitForTimeout(1500);
const soal = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
const adaTimer = await page.locator('text=/\\d{2}:\\d{2}/').count();
const opsi = await page.locator('button:has-text("A"), label:has-text("A")').count();
console.log('SOAL TERLIHAT:', soal.slice(0, 320));
console.log('elemen timer:', adaTimer, '| elemen opsi A:', opsi);
if (!/petunjuk|soal|Relasi|Banjir|prisma|segitiga|batang|kutip/i.test(soal)) gagal.push('teks soal tidak terlihat setelah mulai');

// jawab satu butir via keyboard
await page.keyboard.press('a');
await page.waitForTimeout(400);
const sesi = await page.evaluate(() => localStorage.getItem('tntrainer:sesi:aktif'));
const sesiObj = sesi ? JSON.parse(sesi) : null;
console.log('SESI TERSIMPAN:', sesiObj ? `${sesiObj.daftarItem.length} butir | dijawab ${Object.values(sesiObj.jawaban || {}).filter(Boolean).length} | budget ${sesiObj.budgetDetik}s` : 'tidak ada');
if (!sesiObj) gagal.push('sesi tidak tersimpan di localStorage');
if (sesiObj && sesiObj.daftarItem.length !== 10) gagal.push(`sesi berisi ${sesiObj.daftarItem.length} butir, harusnya 10`);

await page.screenshot({ path: 'dist/paket-cek.png', fullPage: false });
console.log('SCREENSHOT: dist/paket-cek.png');
console.log(gagal.length ? `GAGAL: ${gagal.join(' | ')}` : 'SEMUA CEK LOLOS');
await browser.close();
