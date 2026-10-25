import { useEffect, useState } from 'preact/hooks';
import { loadBank, type LoadedBank } from '@lib/bank';
import { MAPEL_META } from '@data/taxonomy';
import type { Mapel } from '@data/schema';
import Icon from '../ui/Icon';

export default function HomeStats() {
  const [bank, setBank] = useState<LoadedBank | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    loadBank().then((r) => {
      setBank(r.bank);
      setFromCache(r.fromCache);
    });
  }, []);

  if (!bank) {
    return (
      <div class="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} class="card animate-pulse">
            <div class="h-3 w-16 rounded bg-slate-100" />
            <div class="mt-2 h-7 w-10 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(['matematika', 'ipa', 'bindo', 'bing'] as Mapel[]).map((m) => {
          const n = (bank.byMapel.get(m) || []).length;
          return (
            <div class="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
              <p class="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                {MAPEL_META[m].kode}
              </p>
              <p class="mt-0.5 text-xl font-bold leading-none tabular-nums text-slate-900">{n}</p>
              <p class="mt-1 truncate text-[0.68rem] text-slate-500">{MAPEL_META[m].nama}</p>
            </div>
          );
        })}
      </div>
      <p class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>
          Total <strong class="text-slate-700">{bank.items.length}</strong> butir · bank{' '}
          <span class="font-mono">{bank.manifest.versi}</span>
        </span>
        {fromCache && (
          <span class="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
            <Icon name="alert" class="h-3 w-3" /> mode offline
          </span>
        )}
        {bank.items.length === 0 && (
          <a href="/bank" class="font-semibold text-tn-600 hover:underline">
            Bank kosong — muat bank soal
          </a>
        )}
      </p>
    </div>
  );
}
