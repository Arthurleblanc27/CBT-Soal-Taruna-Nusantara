import type { BankManifest, Item, Mapel } from '@data/schema';
import { KATEGORI_BY_SLUG } from '@data/taxonomy';

const LS_KEY = 'tntrainer:bank';
const LS_VERSION_KEY = 'tntrainer:bank:versi';

export interface LoadedBank {
  manifest: BankManifest;
  items: Item[];
  byId: Map<string, Item>;
  byKategori: Map<string, Item[]>;
  byMapel: Map<Mapel, Item[]>;
}

function emptyBank(manifest: BankManifest): LoadedBank {
  return {
    manifest,
    items: [],
    byId: new Map(),
    byKategori: new Map(),
    byMapel: new Map(),
  };
}

function indexItems(items: Item[]): Omit<LoadedBank, 'manifest'> {
  const byId = new Map<string, Item>();
  const byKategori = new Map<string, Item[]>();
  const byMapel = new Map<Mapel, Item[]>();
  for (const item of items) {
    byId.set(item.id, item);
    const listK = byKategori.get(item.kategori) || [];
    listK.push(item);
    byKategori.set(item.kategori, listK);
    const listM = byMapel.get(item.mapel) || [];
    listM.push(item);
    byMapel.set(item.mapel, listM);
  }
  return { items, byId, byKategori, byMapel };
}

export async function loadBank(): Promise<{ bank: LoadedBank; fromCache: boolean; error?: string }> {
  const url = `/bank/manifest.json?ts=${Date.now()}`;
  let manifest: BankManifest;
  let manifestSource: 'network' | 'cache' = 'network';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifest = (await res.json()) as BankManifest;
    manifestSource = 'network';
  } catch (e) {
    const cached = localStorage.getItem(LS_KEY);
    const cachedVersi = localStorage.getItem(LS_VERSION_KEY);
    if (cached && cachedVersi) {
      try {
        manifest = JSON.parse(cached) as BankManifest;
        manifestSource = 'cache';
      } catch {
        return { bank: emptyBank({ versi: 'kosong', dibuat: new Date().toISOString(), file: [] }), fromCache: false, error: 'Manifest tidak bisa dimuat dan cache rusak.' };
      }
    } else {
      return { bank: emptyBank({ versi: 'kosong', dibuat: new Date().toISOString(), file: [] }), fromCache: false, error: `Gagal memuat manifest: ${(e as Error).message}` };
    }
  }

  const items: Item[] = [];
  const errors: string[] = [];

  // Butir hasil impor lokal (ditambahkan di atas bank yang disajikan server)
  try {
    const impor = JSON.parse(localStorage.getItem('tntrainer:bank:impor') || '[]') as Item[];
    if (Array.isArray(impor)) items.push(...impor);
  } catch {
    // abaikan impor rusak
  }

  for (const entry of manifest.file) {
    try {
      const res = await fetch(`/bank/${entry.path}?ts=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Item[];
      items.push(...data);
    } catch (e) {
      errors.push(`${entry.path}: ${(e as Error).message}`);
    }
  }

  const bank = { manifest, ...indexItems(items) };

  if (manifestSource === 'network') {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(manifest));
      localStorage.setItem(LS_VERSION_KEY, manifest.versi);
    } catch {
      // storage might be full
    }
  }

  return {
    bank,
    fromCache: manifestSource === 'cache',
    error: errors.length ? `Beberapa file bank gagal dimuat: ${errors.join('; ')}` : undefined,
  };
}

export function reloadBank(): Promise<{ bank: LoadedBank; fromCache: boolean; error?: string }> {
  try {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_VERSION_KEY);
  } catch {
    // ignore
  }
  return loadBank();
}

export function importBankFile(file: File): Promise<Item[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        resolve(Array.isArray(data) ? data : [data]);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function exportBankAsJson(bank: LoadedBank): string {
  return JSON.stringify(
    { manifest: bank.manifest, items: bank.items },
    null,
    2
  );
}

export function kategoriStats(bank: LoadedBank) {
  return Array.from(KATEGORI_BY_SLUG.entries()).map(([slug, kat]) => {
    const items = bank.byKategori.get(slug) || [];
    return { slug, ...kat, jumlah: items.length };
  });
}
