import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();

const problems = [];
const rows = [];

page.on('pageerror', (e) => problems.push(`[pageerror] ${page.url()} :: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') {
    const t = m.text();
    // CDN/font yang diblokir offline bukan cacat integrasi
    if (/Failed to load resource|fonts\.googleapis|jsdelivr|ERR_/i.test(t)) return;
    problems.push(`[console] ${page.url()} :: ${t}`);
  }
});

const sesi = () => page.evaluate(() => {
  const raw = localStorage.getItem('tntrainer:sesi:aktif');
  return raw ? JSON.parse(raw) : null;
});

async function bersih(url) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
}

async function mulaiSesi(url, labelTombol, nama) {
  await bersih(url);
  const btn = page.getByRole('button', { name: new RegExp(labelTombol, 'i') }).first();
  if (!(await btn.count())) {
    problems.push(`${nama}: tombol "${labelTombol}" tidak ditemukan`);
    return;
  }
  await btn.click();
  await page.waitForTimeout(900);
  const s = await sesi();
  if (!s) {
    problems.push(`${nama}: sesi tidak terbentuk`);
    rows.push([nama, 'GAGAL', '-', '-']);
    return;
  }
  rows.push([nama, `${s.daftarItem.length} butir`, `${s.blokMapel?.length || 0} blok`, `${Math.round(s.budgetDetik / 60)} mnt`]);
}

// ---------- halaman statis ----------
for (const [url, nama, cek] of [
  ['/', 'beranda', /TN Trainer/],
  ['/bank', 'bank', /bank|butir|Bank/i],
  ['/analitik', 'analitik', /analitik|kategori/i],
  ['/rencana', 'rencana', /minggu|rencana/i],
  ['/paket', 'paket', /Tiga paket soal/],
]) {
  await bersih(url);
  const txt = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const ok = cek.test(txt);
  rows.push([nama, ok ? 'render OK' : 'teks tidak cocok', '', '']);
  if (!ok) problems.push(`${nama}: teks halaman tidak sesuai (${txt.slice(0, 120)})`);
}

// jumlah butir per mapel yang benar-benar dimuat bank
await bersih('/bank');
const bankInfo = await page.evaluate(async () => {
  const m = await (await fetch('/bank/manifest.json?ts=' + Date.now())).json();
  const manifestSum = m.file.reduce((s, f) => s + f.jumlah, 0);
  let total = 0;
  const per = {};
  for (const f of m.file) {
    const items = await (await fetch('/bank/' + f.path + '?ts=' + Date.now())).json();
    total += items.length;
    for (const it of items) per[it.mapel] = (per[it.mapel] || 0) + 1;
  }
  return { versi: m.versi, files: m.file.length, total, per, manifestSum };
});
rows.push(['bank manifest', `${bankInfo.files} file / ${bankInfo.total} butir`, JSON.stringify(bankInfo.per), bankInfo.versi]);
if (bankInfo.total !== bankInfo.manifestSum) problems.push(`bank: total butir ${bankInfo.total}, manifest menjumlah ${bankInfo.manifestSum}`);

// ---------- mode per mapel ----------
for (const m of ['matematika', 'ipa', 'bindo', 'bing']) {
  await mulaiSesi(`/belajar/${m}`, 'Mulai sesi', `belajar/${m}`);
  await mulaiSesi(`/cepat/${m}`, 'Mulai sesi', `cepat/${m}`);
}

// ---------- simulasi ----------
await mulaiSesi('/simulasi/padat-105', 'Mulai simulasi', 'simulasi/padat-105');
await bersih('/simulasi/longgar-90');
await page.getByRole('button', { name: /Mulai simulasi/i }).first().click();
await page.waitForTimeout(900);
const longgar = await sesi();
rows.push(['simulasi/longgar-90', longgar ? `${longgar.daftarItem.length} butir` : 'GAGAL', '', longgar ? `${Math.round(longgar.budgetDetik / 60)} mnt` : '']);
if (!longgar) problems.push('simulasi/longgar-90: sesi tidak terbentuk');

// ---------- paket 1 lengkap sampai hasil ----------
await mulaiSesi('/paket/paket-1', 'Mulai dengan timer', 'paket-1 mulai');
await page.waitForTimeout(500);
const s1 = await sesi();
if (s1) {
  for (let i = 0; i < s1.daftarItem.length; i++) {
    const opsi = page.getByRole('radio');
    if (await opsi.count()) await opsi.nth(1).click();
    await page.waitForTimeout(150);
    if (i < s1.daftarItem.length - 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
    }
  }
  const jawabSekarang = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('tntrainer:sesi:aktif') || '{}');
    return Object.values(s.jawaban || {}).filter(Boolean).length;
  });
  console.log('JAWABAN SEBELUM SELESAI:', jawabSekarang, '/', s1.daftarItem.length);
  // Butir terakhir dijawab → hasil tampil otomatis (tanpa menekan Selesai)
  for (let i = 0; i < 25 && !page.url().includes('/hasil'); i++) await page.waitForTimeout(300);
  await page.waitForTimeout(1200);
  const url = page.url();
  const txt = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400);
  const hasil = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('tntrainer:hasil')));
  rows.push(['paket-1 selesai', url.replace(BASE, ''), `${hasil.length} hasil tersimpan`, txt.slice(0, 80)]);
  if (!hasil.length) problems.push('paket-1: hasil tidak tersimpan setelah selesai');
  if (!/hasil|skor|akurasi|nilai/i.test(txt)) problems.push(`paket-1: halaman hasil tidak menampilkan skor (${txt.slice(0, 120)})`);
}

// ---------- paket 2 & 3 ----------
for (const id of ['paket-2', 'paket-3']) {
  await bersih(`/paket/${id}`);
  const h1 = await page.locator('h1').first().innerText();
  const sumber = await page.locator('li code').count();
  rows.push([id, h1, `${sumber} sumber`, '']);
  const jumlahPaket = await page.evaluate(async (pid) => {
    const d = await (await fetch('/paket/paket-tn-trainer.json?ts=' + Date.now())).json();
    return d.paket.find((x) => x.id === pid)?.jumlah ?? 0;
  }, id);
  if (sumber !== jumlahPaket) problems.push(`${id}: ${sumber} baris sumber, harusnya ${jumlahPaket}`);
}

// ---------- cetak ringkasan ----------
console.log('\n=== RINGKASAN INTEGRASI ===');
for (const r of rows) console.log(r.join(' | '));
console.log('\n=== MASALAH (' + problems.length + ') ===');
for (const p of problems) console.log('- ' + p);
console.log(problems.length ? 'ADA MASALAH' : 'SEMUA INTEGRASI LOLOS');

await ctx.close();
await browser.close();
