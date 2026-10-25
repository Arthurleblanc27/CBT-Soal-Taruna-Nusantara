import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { ItemSchema } from '../src/data/schema.ts';
import { KATEGORI_BY_SLUG } from '../src/data/taxonomy.ts';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const bankDir = join(root, 'public', 'bank');

async function main() {
  const entries = [];
  const files = (await readdir(bankDir)).filter((f) => f.endsWith('.json') && f !== 'manifest.json');

  for (const f of files.sort()) {
    const raw = JSON.parse(await readFile(join(bankDir, f), 'utf-8'));
    if (!Array.isArray(raw)) {
      console.error(`File ${f} bukan array, dilewati.`);
      continue;
    }
    const items = raw.map((x, i) => {
      const parsed = ItemSchema.safeParse(x);
      if (!parsed.success) {
        console.error(`  ${f} #${i + 1}: ${parsed.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')}`);
      }
      return parsed.success ? parsed.data : null;
    }).filter(Boolean);

    if (items.length === 0) continue;
    const mapel = items[0].mapel;
    const kategori = items[0].kategori;
    const kat = KATEGORI_BY_SLUG.get(kategori);
    if (!kat || kat.mapel !== mapel) {
      console.error(`File ${f} memiliki kategori/maple yang tidak konsisten.`);
      continue;
    }
    const hash = crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex').slice(0, 16);
    entries.push({ path: f, mapel, kategori, jumlah: items.length, hash });
  }

  const manifest = {
    versi: new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19),
    dibuat: new Date().toISOString(),
    file: entries,
  };

  await writeFile(join(bankDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Manifest dibuat: ${entries.length} file, ${entries.reduce((s, e) => s + e.jumlah, 0)} butir.`);
}

main();
