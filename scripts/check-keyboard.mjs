import { chromium } from '@playwright/test';
const B = 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 950 } })).newPage();
const st = () => page.evaluate(() => JSON.parse(localStorage.getItem('tntrainer:sesi:aktif') || 'null'));

await page.goto(B + '/paket/paket-2/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Mulai dengan timer/i }).click();
await page.waitForTimeout(800);

const jawab = [];
for (let i = 0; i < 10; i++) {
  const k = ['a', 'b', 'c', 'd', 'a'][i % 5];
  await page.keyboard.press(k);
  await page.waitForTimeout(150);
  const s = await st();
  jawab.push(`${i + 1}:${s.indeks}/${JSON.stringify(s.jawaban[s.daftarItem[s.indeks]])}`);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(180);
}
const akhir = await st();
console.log(JSON.stringify(jawab));
console.log('indeks akhir:', akhir.indeks, '| butir:', akhir.daftarItem.length, '| dijawab:', Object.values(akhir.jawaban).filter((v) => ['A','B','C','D','E'].includes(v)).length);

// pastikan tidak ada jawaban berisi nama tombol
const kotor = Object.entries(akhir.jawaban).filter(([, v]) => !['A', 'B', 'C', 'D', 'E', null].includes(v));
console.log('jawaban tidak sah:', kotor.length, JSON.stringify(kotor.slice(0, 3)));

await page.screenshot({ path: 'dist/cek-keyboard.png' });
await page.getByRole('button', { name: 'Selesai', exact: true }).first().click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Ya, selesaikan', exact: true }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: 'dist/cek-hasil.png', fullPage: false });
console.log('halaman hasil:', page.url().replace(B, ''));
console.log('teks:', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 260));
await browser.close();
