import { useEffect, useRef, useState } from 'preact/hooks';
import type { Item } from '@data/schema';
import { ItemSchema } from '@data/schema';
import { KATEGORI_BY_SLUG } from '@data/taxonomy';
import { validateItem } from '@data/validate';
import { loadBank, reloadBank, exportBankAsJson, type LoadedBank } from '@lib/bank';
import { downloadJson } from '@lib/storage';
import Icon from '../ui/Icon';

export default function BankManager() {
  const [bank, setBank] = useState<LoadedBank | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pesan, setPesan] = useState<string | null>(null);
  const [imporJumlah, setImporJumlah] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [detail, setDetail] = useState(false);

  const muat = async (reload = false) => {
    setLoading(true);
    setError(null);
    const res = reload ? await reloadBank() : await loadBank();
    setBank(res.bank);
    setFromCache(res.fromCache);
    setError(res.error ?? null);
    setImporJumlah(bacaImpor().length);
    setLoading(false);
  };

  useEffect(() => {
    muat();
  }, []);

  function bacaImpor(): Item[] {
    try {
      const raw = JSON.parse(localStorage.getItem('tntrainer:bank:impor') || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  const onImpor = async (file: File) => {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const arr: unknown[] = Array.isArray(raw) ? raw : raw.items ?? [];
      const valid: Item[] = [];
      const errs: string[] = [];
      arr.forEach((r, i) => {
        const parsed = ItemSchema.safeParse(r);
        if (!parsed.success) {
          errs.push(`#${i + 1}: bentuk tidak valid`);
          return;
        }
        const sem = validateItem(parsed.data);
        if (sem.length) {
          errs.push(`#${i + 1} (${parsed.data.id}): ${sem[0].message}`);
          return;
        }
        valid.push(parsed.data);
      });
      localStorage.setItem('tntrainer:bank:impor', JSON.stringify(valid));
      setPesan(
        `${valid.length} butir diimpor${errs.length ? `, ${errs.length} ditolak (${errs.slice(0, 3).join('; ')})` : ''}.`
      );
      await muat();
    } catch (e) {
      setPesan(`Impor gagal: ${(e as Error).message}`);
    }
  };

  const hapusImpor = async () => {
    localStorage.removeItem('tntrainer:bank:impor');
    setPesan('Butir impor lokal dihapus.');
    await muat();
  };

  if (loading) {
    return (
      <div class="card flex items-center gap-3 text-sm text-slate-600">
        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-tn-500 border-t-transparent" />
        Memuat bank soal…
      </div>
    );
  }

  if (!bank) return null;

  const total = bank.items.length;
  const perKategori = Array.from(KATEGORI_BY_SLUG.values()).map((k) => ({
    ...k,
    jumlah: (bank.byKategori.get(k.slug) || []).length,
  }));
  const kurang = perKategori.filter((k) => k.jumlah < 4);

  return (
    <div class="space-y-4">
      {/* Status */}
      <div class="card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <span
              class={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Icon name={error ? 'alert' : 'database'} class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-base font-bold text-slate-900">Bank soal aktif</h2>
              <p class="mt-0.5 text-xs text-slate-500">
                Versi <span class="font-mono text-slate-700">{bank.manifest.versi}</span> · {total} butir ·{' '}
                {bank.manifest.file.length} file
              </p>
              <p class="text-xs text-slate-500">
                Dibuat {new Date(bank.manifest.dibuat).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="btn-secondary" onClick={() => muat(true)}>
              <Icon name="refresh" class="h-4 w-4" /> Muat ulang
            </button>
            <button class="btn-secondary" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" class="h-4 w-4" /> Impor JSON
            </button>
            <button
              class="btn-secondary"
              onClick={() => downloadJson(`tn-bank-${bank.manifest.versi}.json`, JSON.parse(exportBankAsJson(bank)))}
            >
              <Icon name="download" class="h-4 w-4" /> Ekspor bank
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              class="hidden"
              onChange={(e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) onImpor(f);
                (e.target as HTMLInputElement).value = '';
              }}
            />
          </div>
        </div>

        {fromCache && (
          <p class="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <Icon name="alert" class="h-4 w-4" /> Mode offline · memakai cache bank versi lama.
          </p>
        )}
        {error && (
          <p class="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <Icon name="alert" class="h-4 w-4" /> {error}
          </p>
        )}
        {pesan && (
          <p class="mt-3 flex items-center gap-2 rounded-lg bg-tn-50 px-3 py-2 text-xs text-tn-800">
            <Icon name="check" class="h-4 w-4" /> {pesan}
          </p>
        )}
        {imporJumlah > 0 && (
          <div class="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <span>{imporJumlah} butir dari impor lokal aktif.</span>
            <button class="font-semibold text-rose-600 hover:underline" onClick={hapusImpor}>
              Hapus impor
            </button>
          </div>
        )}
      </div>

      {/* Sebaran per mapel */}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(['matematika', 'ipa', 'bindo', 'bing'] as const).map((m) => {
          const n = (bank.byMapel.get(m) || []).length;
          const kat = perKategori.filter((k) => k.mapel === m);
          const siap = kat.filter((k) => k.jumlah >= 4).length;
          return (
            <div class="card">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{m}</p>
              <p class="mt-1 text-3xl font-bold tabular-nums text-slate-900">{n}</p>
              <p class="text-xs text-slate-500">
                {siap}/{kat.length} kategori siap (≥4 butir)
              </p>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full bg-tn-500" style={{ width: `${(siap / kat.length) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel kategori */}
      <div class="card">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Butir per kategori</h3>
          <button class="text-xs font-semibold text-tn-600 hover:underline" onClick={() => setDetail((d) => !d)}>
            {detail ? 'Ringkas' : 'Tampilkan semua'}
          </button>
        </div>
        <div class="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {perKategori
            .filter((k) => detail || k.jumlah > 0)
            .map((k) => (
              <div class="flex items-center justify-between gap-2 border-b border-dashed border-slate-100 py-1 text-xs">
                <span class="truncate text-slate-600">{k.nama}</span>
                <span class="flex items-center gap-1.5">
                  <span class="tabular-nums text-slate-500">{k.jumlah}</span>
                  <span
                    class={`inline-block h-2 w-2 rounded-full ${
                      k.jumlah >= 4 ? 'bg-emerald-500' : k.jumlah > 0 ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  />
                </span>
              </div>
            ))}
        </div>
        {kurang.length > 0 && (
          <p class="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            {kurang.length} kategori masih di bawah 4 butir. Tambahkan file JSON di{' '}
            <code class="rounded bg-slate-100 px-1">public/bank/</code> lalu jalankan{' '}
            <code class="rounded bg-slate-100 px-1">npm run bank</code>.
          </p>
        )}
      </div>

      {/* Daftar file */}
      <div class="card">
        <h3 class="mb-3 text-sm font-bold text-slate-800">File bank</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400">
              <tr class="border-b border-slate-100">
                <th class="pb-2 font-semibold">File</th>
                <th class="pb-2 font-semibold">Mapel</th>
                <th class="pb-2 font-semibold">Kategori</th>
                <th class="pb-2 text-right font-semibold">Butir</th>
                <th class="pb-2 text-right font-semibold">Hash</th>
              </tr>
            </thead>
            <tbody class="text-slate-600">
              {bank.manifest.file.map((f) => (
                <tr class="border-b border-slate-50">
                  <td class="py-1.5 font-mono text-[0.7rem]">{f.path}</td>
                  <td class="py-1.5">{f.mapel}</td>
                  <td class="py-1.5">{KATEGORI_BY_SLUG.get(f.kategori)?.nama ?? f.kategori}</td>
                  <td class="py-1.5 text-right tabular-nums">{f.jumlah}</td>
                  <td class="py-1.5 text-right font-mono text-[0.7rem] text-slate-400">{f.hash ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
