import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ItemSchema, BankManifestSchema } from '../src/data/schema.ts';
import { validateBank, validateCategoryCounts } from '../src/data/validate.ts';
import { KATEGORI_BY_SLUG } from '../src/data/taxonomy.ts';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const bankDir = join(root, 'public', 'bank');
const imgDir = join(root, 'public', 'img');

function logErrors(errors) {
  for (const e of errors) {
    const loc = [e.file, e.id].filter(Boolean).join(' / ') || 'global';
    console.error(`  [${e.rule}] ${loc}: ${e.message}`);
  }
}

function logWarnings(warnings) {
  for (const e of warnings) {
    const loc = [e.file, e.id].filter(Boolean).join(' / ') || 'global';
    console.warn(`  [${e.rule}] ${loc}: ${e.message}`);
  }
}

async function fileExists(rel) {
  try {
    await stat(join(root, 'public', rel));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let manifest;
  try {
    manifest = BankManifestSchema.parse(JSON.parse(await readFile(join(bankDir, 'manifest.json'), 'utf-8')));
  } catch (e) {
    console.error('manifest.json tidak valid:', e.message);
    process.exit(1);
  }

  const allItems = [];
  const fileErrors = [];

  for (const entry of manifest.file) {
    const path = join(bankDir, entry.path);
    let items;
    try {
      items = JSON.parse(await readFile(path, 'utf-8'));
      if (!Array.isArray(items)) throw new Error('file bank harus berupa array');
    } catch (e) {
      fileErrors.push({ file: entry.path, rule: 'io', message: e.message });
      continue;
    }

    const parsed = [];
    for (let i = 0; i < items.length; i++) {
      const raw = items[i];
      const parse = ItemSchema.safeParse(raw);
      if (!parse.success) {
        fileErrors.push({ file: entry.path, rule: 'schema', message: `butir #${i + 1}: ${parse.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')}` });
        continue;
      }
      parsed.push(parse.data);

      // validasi gambar stimulus ada
      if (parse.data.stimulus?.gambar) {
        if (!(await fileExists(parse.data.stimulus.gambar))) {
          fileErrors.push({ id: parse.data.id, file: entry.path, rule: 'gambar', message: `Gambar ${parse.data.stimulus.gambar} tidak ditemukan` });
        }
      }

      // validasi kategori cocok dengan manifest
      const kat = KATEGORI_BY_SLUG.get(parse.data.kategori);
      if (kat?.mapel !== entry.mapel || parse.data.kategori !== entry.kategori) {
        fileErrors.push({ id: parse.data.id, file: entry.path, rule: 'manifest', message: `Kategori/maple tidak cocok dengan manifest` });
      }
    }

    const res = validateBank(parsed, entry.path);
    if (!res.ok) fileErrors.push(...res.errors);
    allItems.push(...parsed);

    if (parsed.length !== entry.jumlah) {
      fileErrors.push({ file: entry.path, rule: 'jumlah', message: `Jumlah di manifest (${entry.jumlah}) != jumlah valid (${parsed.length})` });
    }
  }

  const catRes = validateCategoryCounts(allItems);

  console.log(`Validator bank selesai. Total butir valid: ${allItems.length}`);
  if (fileErrors.length) {
    console.error(`\n${fileErrors.length} kesalahan ditemukan:`);
    logErrors(fileErrors);
  }
  // Category minimum is treated as warning until the bank reaches v1 minimum (164 items)
  if (catRes.errors.length) {
    if (allItems.length < 164) {
      console.warn(`\n${catRes.errors.length} peringatan jumlah kategori (bank belum mencapai minimum 164 butir):`);
      logWarnings(catRes.errors);
    } else {
      console.error(`\n${catRes.errors.length} kesalahan jumlah kategori:`);
      logErrors(catRes.errors);
      fileErrors.push(...catRes.errors);
    }
  }

  if (fileErrors.length) {
    process.exit(1);
  }
  console.log('Semua validasi lolos.');
}

main();
