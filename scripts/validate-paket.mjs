import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ItemSchema } from '../src/data/schema.ts';
import { validateBank } from '../src/data/validate.ts';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const paketDir = join(root, 'public', 'paket');

const files = (await readdir(paketDir)).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error('Tidak ada file paket di public/paket.');
  process.exit(1);
}

const errors = [];
const seen = new Map();
let totalButir = 0;

// Dua bentuk didukung: satu berkas berisi banyak paket ({ paket: [...] }),
// atau satu berkas berisi satu paket ({ ids, butir }).
function bacaPaket(doc, file) {
  if (Array.isArray(doc.paket)) return doc.paket;
  if (Array.isArray(doc.butir)) return [doc];
  errors.push({ file, rule: 'struktur', message: 'tidak memuat properti "paket" maupun "butir"' });
  return [];
}

for (const f of files.sort()) {
  const doc = JSON.parse(await readFile(join(paketDir, f), 'utf-8'));
  const daftar = bacaPaket(doc, f);
  console.log(`${f}: ${daftar.length} paket`);

  for (const paket of daftar) {
    const label = `${f} / ${paket.id ?? 'tanpa-id'}`;
    if (!Array.isArray(paket.butir)) {
      errors.push({ file: label, rule: 'struktur', message: 'properti butir harus berupa array' });
      continue;
    }
    if (!Array.isArray(paket.ids) || paket.ids.length !== paket.butir.length) {
      errors.push({ file: label, rule: 'ids', message: 'jumlah ids tidak sama dengan jumlah butir' });
    }

    const parsed = [];
    for (const raw of paket.butir) {
      const p = ItemSchema.safeParse(raw);
      if (!p.success) {
        errors.push({ file: label, id: raw?.id, rule: 'schema', message: p.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ') });
        continue;
      }
      parsed.push(p.data);
      if (seen.has(p.data.id)) {
        errors.push({ file: label, id: p.data.id, rule: 'duplikat-paket', message: `butir yang sama juga ada di ${seen.get(p.data.id)}` });
      } else {
        seen.set(p.data.id, label);
      }
    }

    const res = validateBank(parsed, label);
    if (!res.ok) errors.push(...res.errors);

    if (paket.ids?.join(',') !== parsed.map((x) => x.id).join(',')) {
      errors.push({ file: label, rule: 'urutan', message: 'urutan ids berbeda dengan urutan butir' });
    }

    const hitung = (m) => parsed.filter((x) => x.mapel === m).length;
    const naskah = parsed.filter((x) => x.asal === 'naskah').length;
    const detik = parsed.reduce((s, x) => s + x.targetDetik, 0);
    console.log(
      `  ${paket.id}: ${parsed.length} butir | naskah ${naskah} | prediksi ${parsed.length - naskah} | ` +
        `MAT ${hitung('matematika')} IPA ${hitung('ipa')} BIN ${hitung('bindo')} BIG ${hitung('bing')} | ` +
        `\u00b1${Math.round(detik / 60)} menit`
    );
    totalButir += parsed.length;
  }
}

console.log(`\nTotal butir pada paket: ${totalButir} | butir unik: ${seen.size}`);
if (errors.length) {
  console.error(`\n${errors.length} kesalahan:`);
  for (const e of errors) console.error(`  [${e.rule}] ${e.file}${e.id ? ' / ' + e.id : ''}: ${e.message}`);
  process.exit(1);
}
console.log('Semua paket lolos validasi.');
