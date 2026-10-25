export interface MetrikKecepatan {
  medianDetik: number;
  p75Detik: number;
  persenTepatWaktu: number;
  indeks: number;
}

export function metrikKecepatan(durasiMs: number[], targetDetik: number): MetrikKecepatan {
  const d = durasiMs.length ? [...durasiMs].sort((a, b) => a - b) : [0];
  const p = (q: number) => {
    if (d.length === 0) return 0;
    return d[Math.min(d.length - 1, Math.floor(q * d.length))];
  };
  const medianMs = p(0.5);
  return {
    medianDetik: Math.round((medianMs / 1000) * 10) / 10,
    p75Detik: Math.round((p(0.75) / 1000) * 10) / 10,
    persenTepatWaktu: d.length ? d.filter((x) => x <= targetDetik * 1000).length / d.length : 0,
    indeks: medianMs > 0 ? Math.round((targetDetik / (medianMs / 1000)) * 100) / 100 : 0,
  };
}

export function agregatKecepatanPerKategori(
  durasiMap: Record<string, number>,
  targetMap: Record<string, number>
): Record<string, MetrikKecepatan> {
  const groups: Record<string, number[]> = {};
  for (const [id, ms] of Object.entries(durasiMap)) {
    const kat = id.split('-').slice(0, 2).join('-');
    if (!groups[kat]) groups[kat] = [];
    groups[kat].push(ms);
  }
  const out: Record<string, MetrikKecepatan> = {};
  for (const [kat, times] of Object.entries(groups)) {
    out[kat] = metrikKecepatan(times, targetMap[kat] ?? 60);
  }
  return out;
}

export function skorKecepatan(akurasi: number, persenTepatWaktu: number): number {
  return Math.round((akurasi * 0.6 + persenTepatWaktu * 100 * 0.4) * 10) / 10;
}
