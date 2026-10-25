import type { Sesi } from './session';
import { getJson, setJson, remove } from './storage';

const KEY_AKTIF = 'sesi:aktif';

/** Baca sesi aktif dari localStorage; null bila tidak ada atau versi tidak cocok. */
export function bacaSesiAktif(): Sesi | null {
  const s = getJson<Sesi>(KEY_AKTIF);
  if (!s || s.v !== 2) return null;
  if (s.selesai) return null;
  return s;
}

export function simpanSesiAktif(sesi: Sesi): void {
  setJson(KEY_AKTIF, sesi);
}

export function hapusSesiAktif(): void {
  remove(KEY_AKTIF);
}

export function sisaWaktuSesi(sesi: Sesi): number {
  const elapsed = (Date.now() - sesi.mulai) / 1000;
  return Math.max(0, sesi.budgetDetik - elapsed);
}
