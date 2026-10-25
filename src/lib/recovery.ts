import { bacaSesiAktif, hapusSesiAktif, sisaWaktuSesi } from './sessionStore';
import { finishSesi, type SesiResult } from './session';
import { simpanHasil } from './analytics';

/**
 * Sesi yang waktunya sudah habis saat halaman dibuka kembali harus ditutup
 * dan disimpan sebagai hasil — jangan biarkan menggantung tanpa skor.
 */
export function finalisasiKedaluwarsa(): SesiResult | null {
  const sesi = bacaSesiAktif();
  if (!sesi) return null;
  if (sesi.budgetDetik <= 0) return null;
  if (sisaWaktuSesi(sesi) > 0) return null;

  const hasil = finishSesi(sesi);
  simpanHasil(hasil);
  hapusSesiAktif();
  return hasil;
}

export function sesiMilikPaket(daftarItem: string[], idPaket: string[]): boolean {
  if (daftarItem.length !== idPaket.length) return false;
  const set = new Set(idPaket);
  return daftarItem.every((id) => set.has(id));
}
