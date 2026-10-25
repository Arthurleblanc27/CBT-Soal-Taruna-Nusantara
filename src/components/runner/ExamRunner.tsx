import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Item, Mapel } from '@data/schema';
import { MAPEL_META, KATEGORI_BY_SLUG } from '@data/taxonomy';
import type { Sesi, ModeSesi, FormatSimulasi } from '@lib/session';
import {
  jawab as jawabSesi,
  toggleRagu as toggleRaguSesi,
  finishSesi,
  currentBlokIndex,
} from '@lib/session';
import { simpanSesiAktif, hapusSesiAktif } from '@lib/sessionStore';
import { simpanHasil } from '@lib/analytics';
import { formatDetik } from '@lib/timer';
import QuestionCard, { type KodeJawaban } from './QuestionCard';
import ExplainPanel from '../learn/ExplainPanel';
import NavGrid, { NavRingkas, type StatusNomor } from './NavGrid';
import TimerBar from './TimerBar';
import CheckpointToast, { type ToastVariant } from './CheckpointToast';
import Icon from '../ui/Icon';

interface Toast {
  pesan: string;
  variant: ToastVariant;
  aksi?: { label: string; onClick: () => void };
}

export default function ExamRunner({
  mode,
  format,
  items,
  sesiAwal,
  bankVersi,
  debug = false,
  judul,
}: {
  mode: ModeSesi;
  format?: FormatSimulasi;
  items: Item[];
  sesiAwal: Sesi;
  bankVersi: string;
  debug?: boolean;
  judul: string;
}) {
  const [sesi, setSesi] = useState<Sesi>(sesiAwal);
  const [reveal, setReveal] = useState(false);
  // Pembahasan tidak lagi muncul otomatis setelah menjawab; pengguna memintanya sendiri.
  const [bukaPembahasan, setBukaPembahasan] = useState(false);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [, force] = useState(0);

  // Antrean khusus mode belajar (butir salah diulang)
  const [antrean, setAntrean] = useState<string[]>(items.map((i) => i.id));
  const [benarBerturut, setBenarBerturut] = useState<Record<string, number>>({});
  const [pernahSalah, setPernahSalah] = useState<Set<string>>(new Set());

  // Cepat: bonus waktu dari streak
  const [bonus, setBonus] = useState(0);
  const [streak, setStreak] = useState(0);
  const [deadlineButir, setDeadlineButir] = useState<number>(0);

  const itemStartRef = useRef<number>(performance.now());
  const firedRef = useRef<Set<string>>(new Set());
  const sesiRef = useRef<Sesi>(sesiAwal);
  sesiRef.current = sesi;

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const daftarAktif = mode === 'belajar' ? antrean : sesi.daftarItem;
  const itemAktifId = daftarAktif[Math.min(sesi.indeks, daftarAktif.length - 1)];
  const itemAktif = itemAktifId ? itemById.get(itemAktifId) : undefined;

  const total = daftarAktif.length;
  const terjawab = useMemo(
    () => sesi.daftarItem.filter((id) => sesi.jawaban[id]).length,
    [sesi.daftarItem, sesi.jawaban]
  );
  const jumlahRagu = Object.keys(sesi.ragu).length;

  // ---------- Timer ----------
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  // budgetDetik 0 berarti ujian tanpa batas waktu (tanpa countdown, tanpa auto-submit).
  const tanpaBatas = mode === 'simulasi' && sesi.budgetDetik <= 0;
  const sisaGlobal = tanpaBatas ? Number.POSITIVE_INFINITY : Math.max(0, sesi.budgetDetik - (Date.now() - sesi.mulai) / 1000);
  const semuaTerjawab = sesi.daftarItem.length > 0 && sesi.daftarItem.every((id) => !!sesi.jawaban[id]);
  const blokIdx = currentBlokIndex(sesi);
  const blokAktif = sesi.blokMapel[blokIdx];
  const sisaBlok = blokAktif
    ? Math.max(0, blokAktif.budgetDetik - (Date.now() - blokAktif.mulaiMs) / 1000)
    : undefined;

  const sisaButir =
    mode === 'cepat' && deadlineButir ? Math.max(0, (deadlineButir - Date.now()) / 1000) : undefined;

  // ---------- Persistensi ----------
  useEffect(() => {
    if (!selesai) simpanSesiAktif(sesi);
  }, [sesi, selesai]);

  // ---------- Catat durasi butir ----------
  const catatDurasi = useCallback((id: string | undefined) => {
    if (!id) return;
    const dur = performance.now() - itemStartRef.current;
    itemStartRef.current = performance.now();
    if (dur < 300) return;
    setSesi((s) => ({
      ...s,
      durasiButir: { ...s.durasiButir, [id]: (s.durasiButir[id] || 0) + dur },
    }));
  }, []);

  // Reset saat pindah butir
  useEffect(() => {
    itemStartRef.current = performance.now();
    setReveal(false);
    setBukaPembahasan(false);
    if (mode === 'cepat' && itemAktif) {
      setDeadlineButir(Date.now() + (itemAktif.targetDetik + bonus) * 1000);
    }
  }, [sesi.indeks, itemAktifId, mode]);

  // ---------- Selesai ----------
  const selesaikan = useCallback(
    (alasan?: string) => {
      if (selesai) return;
      setSelesai(true);
      const final = finishSesi(sesiRef.current);
      simpanHasil(final);
      hapusSesiAktif();
      if (alasan) setToast({ pesan: alasan, variant: 'danger' });
      window.location.href = `/hasil?id=${final.id}`;
    },
    [selesai]
  );

  // Auto-submit ketika waktu global habis (simulasi)
  useEffect(() => {
    if (mode !== 'simulasi' || tanpaBatas || paused || selesai) return;
    if (sisaGlobal <= 0) {
      const kosong = sesi.daftarItem.filter((id) => !sesi.jawaban[id]).length;
      setToast({
        pesan: `Waktu habis. ${kosong} butir tidak terjawab dan dihitung 0. Menyimpan hasil…`,
        variant: 'danger',
      });
      setTimeout(() => selesaikan('Waktu habis — sesi ditutup otomatis.'), 1200);
    }
  }, [sisaGlobal, mode, tanpaBatas, paused, selesai, sesi.daftarItem, sesi.jawaban, selesaikan]);

  // Ujian (paket, simulasi, cepat): begitu butir terakhir dijawab, hasil langsung ditampilkan.
  useEffect(() => {
    if (mode === 'belajar' || paused || selesai) return;
    if (!semuaTerjawab) return;
    const t = setTimeout(() => selesaikan('Semua butir terjawab — menampilkan hasil dan koreksi…'), 700);
    return () => clearTimeout(t);
  }, [semuaTerjawab, mode, paused, selesai, selesaikan]);

  // Cepat: waktu butir habis → auto next
  useEffect(() => {
    if (mode !== 'cepat' || paused || selesai || !deadlineButir) return;
    if (sisaButir !== undefined && sisaButir <= 0) {
      catatDurasi(itemAktifId);
      setStreak(0);
      setBonus(0);
      pindah(1, true);
    }
  }, [sisaButir, mode, paused, selesai, deadlineButir]);

  // ---------- Checkpoint simulasi ----------
  useEffect(() => {
    if (mode !== 'simulasi' || selesai) return;
    const key = (k: string) => `${blokIdx}:${k}`;
    const namaMapel = blokAktif ? MAPEL_META[blokAktif.mapel].nama : '';

    // 5 menit
    if (sisaBlok !== undefined && sisaBlok <= 300 && sisaBlok > 240 && !firedRef.current.has(key('5m'))) {
      firedRef.current.add(key('5m'));
      setToast({ pesan: `Sisa 5 menit untuk blok ${namaMapel}. Periksa butir yang masih kosong.`, variant: 'warning' });
    }
    // 1 menit
    if (sisaBlok !== undefined && sisaBlok <= 60 && !firedRef.current.has(key('1m'))) {
      firedRef.current.add(key('1m'));
      setToast({ pesan: `Sisa 1 menit blok ${namaMapel}. Jawaban akan tersimpan otomatis.`, variant: 'danger' });
    }
    // 70% protokol
    if (
      blokAktif &&
      sisaBlok !== undefined &&
      sisaBlok <= blokAktif.budgetDetik * 0.3 &&
      sisaBlok > blokAktif.budgetDetik * 0.3 - 2 &&
      !firedRef.current.has(key('70'))
    ) {
      firedRef.current.add(key('70'));
      // Protokol 70/30 benar-benar mengubah status sesi, bukan hanya menampilkan pesan.
      setSesi((s) => (s.putaran === 1 ? { ...s, putaran: 2 } : s));
      const sisaKosong = sesi.daftarItem.filter((id) => {
        const it = itemById.get(id);
        return it && it.mapel === blokAktif.mapel && !sesi.jawaban[id];
      }).length;
      setToast({
        pesan: `Putaran 1 selesai — 70% waktu blok terpakai. ${sisaKosong} butir ${namaMapel} masih kosong.`,
        variant: 'info',
        aksi: { label: 'Ke butir kosong', onClick: () => lompatKosong() },
      });
    }
    // transisi blok
    if (blokIdx > 0) {
      const prevKey = `blok:${blokIdx}`;
      if (!firedRef.current.has(prevKey)) {
        firedRef.current.add(prevKey);
        setToast({ pesan: `Blok ${namaMapel} dimulai. Fokus pada target pace ${MAPEL_META[blokAktif!.mapel].targetDetik} detik per butir.`, variant: 'success' });
      }
    }
  }, [blokIdx, sisaBlok, mode, selesai]);

  // ---------- Pindah butir ----------
  const pindah = useCallback(
    (delta: number, dariTimeout = false) => {
      catatDurasi(itemAktifId);
      setSesi((s) => ({
        ...s,
        indeks: Math.max(0, Math.min(daftarAktif.length - 1, s.indeks + delta)),
      }));
      if (dariTimeout) setToast({ pesan: 'Waktu butir habis — lanjut otomatis.', variant: 'warning' });
    },
    [catatDurasi, itemAktifId, daftarAktif.length]
  );

  const lompatKosong = useCallback(() => {
    const idx = sesi.daftarItem.findIndex((id) => !sesi.jawaban[id]);
    if (idx >= 0) {
      catatDurasi(itemAktifId);
      setSesi((s) => ({ ...s, indeks: idx }));
    } else {
      setToast({ pesan: 'Semua butir sudah terjawab.', variant: 'success' });
    }
  }, [sesi.daftarItem, sesi.jawaban, catatDurasi, itemAktifId]);

  // ---------- Jawab ----------
  const pilih = useCallback(
    (kode: KodeJawaban) => {
      if (!itemAktif || paused || selesai) return;
      if (mode === 'belajar' && reveal) return;

      catatDurasi(itemAktif.id);
      setSesi((s) => jawabSesi(s, itemAktif.id, kode));

      if (mode === 'belajar') {
        setReveal(true);
        const benar = kode === itemAktif.kunci;
        if (!benar) {
          setPernahSalah((p) => new Set(p).add(itemAktif.id));
          setBenarBerturut((b) => ({ ...b, [itemAktif.id]: 0 }));
        } else {
          setBenarBerturut((b) => ({ ...b, [itemAktif.id]: (b[itemAktif.id] || 0) + 1 }));
        }
      }

      if (mode === 'cepat') {
        const benar = kode === itemAktif.kunci;
        if (benar) {
          const s = streak + 1;
          setStreak(s);
          setBonus(Math.min(15, s >= 2 ? 5 : 0));
        } else {
          setStreak(0);
          setBonus(0);
        }
      }
    },
    [itemAktif, paused, selesai, mode, reveal, streak, catatDurasi]
  );

  // ---------- Lanjut (belajar) ----------
  const lanjutBelajar = useCallback(() => {
    if (!itemAktif) return;
    const benar = sesi.jawaban[itemAktif.id] === itemAktif.kunci;
    const berturut = benarBerturut[itemAktif.id] || 0;
    const sudahPernahSalah = pernahSalah.has(itemAktif.id);

    let nextAntrean = antrean;
    if (benar && (!sudahPernahSalah || berturut >= 2)) {
      // dikuasai: benar pada percobaan pertama, atau 2× benar berturut setelah salah
      nextAntrean = antrean.filter((id) => id !== itemAktif.id);
    } else if (!benar) {
      nextAntrean = [...antrean.filter((id) => id !== itemAktif.id), itemAktif.id];
    } else {
      // benar sekali setelah pernah salah — masih perlu satu kali lagi
      nextAntrean = [...antrean.filter((id) => id !== itemAktif.id), itemAktif.id];
    }
    setAntrean(nextAntrean);

    if (nextAntrean.length === 0) {
      selesaikan('Semua butir telah dikuasai. Ringkasan belajar disiapkan.');
      return;
    }

    catatDurasi(itemAktif.id);
    setSesi((s) => ({ ...s, indeks: Math.min(s.indeks, nextAntrean.length - 1) }));
    setReveal(false);
  }, [itemAktif, sesi.jawaban, benarBerturut, antrean, catatDurasi, selesaikan]);

  // ---------- Pause ----------
  const togglePause = useCallback(() => {
    if (mode === 'simulasi') return;
    setPaused((p) => {
      const next = !p;
      if (next) {
        setSesi((s) => ({ ...s, pausedAt: Date.now() }));
      } else {
        setSesi((s) => {
          const delta = s.pausedAt ? Date.now() - s.pausedAt : 0;
          return {
            ...s,
            pausedAt: undefined,
            mulai: s.mulai + delta,
            blokMapel: s.blokMapel.map((b) => ({ ...b, mulaiMs: b.mulaiMs + delta })),
          };
        });
        itemStartRef.current = performance.now();
        if (mode === 'cepat' && itemAktif) {
          setDeadlineButir(Date.now() + (itemAktif.targetDetik + bonus) * 1000);
        }
      }
      return next;
    });
  }, [mode, itemAktif, bonus]);

  // ---------- Keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;

      // Tombol aksi (Selesai, Buang, Mulai) tetap memakai perilaku kliknya sendiri.
      // Tombol nomor soal (data-nav) dan tombol opsi tidak boleh menelan Enter,
      // karena di layar ini Enter berarti "lanjut ke soal berikutnya".
      const tombolAksi =
        !!t && t.tagName === 'BUTTON' && !t.hasAttribute('data-nav') && t.getAttribute('role') !== 'radio';
      if (tombolAksi && (e.key === 'Enter' || e.key === ' ')) return;

      // Navigasi diperiksa lebih dulu: perbandingan string seperti "ArrowRight" >= "a"
      // membuat tombol panah/Enter tertangkap cabang jawaban A-E.
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pindah(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (mode === 'belajar' && reveal) lanjutBelajar();
        else pindah(1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (mode === 'belajar' && reveal) lanjutBelajar();
        else if (mode !== 'belajar') pindah(1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setKonfirmasi(true);
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (itemAktif) setSesi((s) => toggleRaguSesi(s, itemAktif.id));
      } else if (/^[a-eA-E]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        pilih(e.key.toUpperCase() as KodeJawaban);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pilih, pindah, lanjutBelajar, mode, reveal, itemAktif]);

  // ---------- Status nomor ----------
  const statusNomor = useCallback(
    (i: number): StatusNomor => {
      const id = daftarAktif[i];
      const it = itemById.get(id);
      if (!it) return 'kosong';
      const j = sesi.jawaban[id];
      if (sesi.ragu[id]) return 'ragu';
      if (!j) return 'kosong';
      if (mode === 'belajar') return j === it.kunci ? 'benar' : 'salah';
      return 'dijawab';
    },
    [daftarAktif, itemById, sesi.jawaban, sesi.ragu, mode]
  );

  if (!itemAktif) {
    return (
      <div class="mx-auto max-w-3xl px-4 py-16 text-center">
        <p class="text-lg font-semibold text-slate-800">Bank soal untuk sesi ini kosong.</p>
        <p class="mt-2 text-sm text-slate-600">
          Muat ulang bank di halaman <a class="text-tn-600 underline" href="/bank">/bank</a> atau pilih kategori lain.
        </p>
      </div>
    );
  }

  const mapelAktif: Mapel = blokAktif?.mapel ?? itemAktif.mapel;
  const meta = MAPEL_META[mapelAktif];
  const kat = KATEGORI_BY_SLUG.get(itemAktif.kategori);
  const persenProgres = total ? Math.round(((sesi.indeks + 1) / total) * 100) : 0;

  return (
    <div class="mx-auto max-w-7xl px-4 py-4">
      {toast && (
        <CheckpointToast
          pesan={toast.pesan}
          variant={toast.variant}
          aksi={toast.aksi}
          onTutup={() => setToast(null)}
        />
      )}

      {/* Header sesi */}
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-3">
          <a href="/" class="btn-ghost px-2" aria-label="Keluar">
            <Icon name="left" class="h-4 w-4" />
          </a>
          <div>
            <h1 class="text-base font-bold leading-tight text-slate-900">{judul}</h1>
            <p class="text-xs text-slate-500">
              {mode === 'simulasi' ? `Simulasi ${format ?? ''}` : `Mode ${mode}`} · {meta.nama}
              {kat ? ` · ${kat.nama.split(':').pop()?.trim()}` : ''}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden text-right sm:block">
            <p class="text-xs text-slate-400">Progres</p>
            <p class="text-sm font-semibold tabular-nums text-slate-700">
              {sesi.indeks + 1}/{total} · {persenProgres}%
            </p>
          </div>
          <button class="btn-secondary" onClick={() => setKonfirmasi(true)}>
            Selesai
          </button>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside class="order-2 space-y-3 lg:order-1">
          <div class="card">
            <h2 class="mb-2 text-sm font-bold text-slate-800">Identitas sesi</h2>
            <dl class="space-y-1.5 text-xs">
              <div class="flex justify-between">
                <dt class="text-slate-500">Mode</dt>
                <dd class="font-semibold capitalize text-slate-700">{mode}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Mapel</dt>
                <dd class="font-semibold text-slate-700">{meta.nama}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Target pace</dt>
                <dd class="font-semibold tabular-nums text-slate-700">{meta.targetDetik} dtk</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Bank</dt>
                <dd class="font-semibold tabular-nums text-slate-700">v{bankVersi.slice(-10)}</dd>
              </div>
              {mode === 'cepat' && (
                <div class="flex justify-between">
                  <dt class="text-slate-500">Streak</dt>
                  <dd class="font-semibold text-amber-600">{streak} · bonus +{bonus}s</dd>
                </div>
              )}
            </dl>
          </div>

          <NavGrid
            total={total}
            indeks={sesi.indeks}
            status={statusNomor}
            onPilih={(i) => {
              catatDurasi(itemAktifId);
              setSesi((s) => ({ ...s, indeks: i }));
            }}
            ragu={jumlahRagu}
            terjawab={mode === 'belajar' ? total - antrean.length : terjawab}
            judul={mode === 'belajar' ? 'Antrean belajar' : 'Navigasi soal'}
          />

          <div class="card no-print">
            <h2 class="mb-2 text-sm font-bold text-slate-800">Pintasan</h2>
            <ul class="space-y-1 text-xs text-slate-600">
              <li class="flex justify-between"><span>Pilih jawaban</span><span><kbd>A</kbd>–<kbd>E</kbd></span></li>
              <li class="flex justify-between"><span>Pindah butir</span><span><kbd>←</kbd><kbd>→</kbd></span></li>
              <li class="flex justify-between"><span>Lanjut / konfirmasi</span><span><kbd>Enter</kbd></span></li>
              <li class="flex justify-between"><span>Tandai ragu</span><span><kbd>F</kbd></span></li>
              <li class="flex justify-between"><span>Keluar</span><span><kbd>Esc</kbd></span></li>
            </ul>
          </div>
        </aside>

        {/* Area soal */}
        <div class="order-1 space-y-3 lg:order-2">
          {mode === 'simulasi' && !tanpaBatas && (
            <TimerBar
              sisaDetik={sisaGlobal}
              budgetDetik={sesi.budgetDetik}
              blokLabel={blokAktif ? MAPEL_META[blokAktif.mapel].nama : undefined}
              sisaBlokDetik={sisaBlok}
              label="Sisa waktu simulasi"
            />
          )}

          {mode === 'simulasi' && tanpaBatas && (
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
              <span class="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <Icon name="clock" class="h-3.5 w-3.5" /> Ujian tanpa batas waktu
              </span>
              <span class="tabular-nums">terjawab {terjawab}/{total}</span>
            </div>
          )}

          {mode === 'cepat' && (
            <TimerBar
              sisaDetik={sisaButir ?? 0}
              budgetDetik={itemAktif.targetDetik + bonus}
              label="Waktu butir"
              compact
              onPause={togglePause}
              paused={paused}
            />
          )}

          {mode === 'belajar' && (
            <div class="card flex flex-wrap items-center justify-between gap-2 py-3">
              <div class="flex items-center gap-3">
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-tn-50 text-tn-600">
                  <Icon name="clock" class="h-4 w-4" />
                </span>
                <div>
                  <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Stopwatch belajar</p>
                  <p class="text-2xl font-bold tabular-nums leading-none text-slate-900">
                    {formatDetik(Math.max(0, (Date.now() - sesi.mulai) / 1000))}
                  </p>
                </div>
                <div class="border-l border-slate-200 pl-3 text-xs text-slate-500">
                  <p>Antrean <strong class="text-slate-700">{antrean.length}</strong> butir</p>
                  <p>Dikuasai <strong class="text-emerald-600">{total - antrean.length}</strong></p>
                </div>
              </div>
              <button class="btn-secondary" onClick={togglePause}>
                <Icon name={paused ? 'play' : 'pause'} class="h-4 w-4" />
                {paused ? 'Lanjut' : 'Jeda'}
              </button>
            </div>
          )}

          <div class="flex items-center justify-between text-xs text-slate-500">
            <NavRingkas total={total} indeks={sesi.indeks} terjawab={terjawab} ragu={jumlahRagu} />
            <span class="hidden items-center gap-1 sm:flex">
              <Icon name="target" class="h-3.5 w-3.5" /> target {itemAktif.targetDetik}s
            </span>
          </div>

          <div class={paused ? 'pointer-events-none opacity-40' : ''}>
            <QuestionCard
              item={itemAktif}
              nomor={sesi.indeks + 1}
              total={total}
              jawaban={sesi.jawaban[itemAktif.id] ?? null}
              onPilih={pilih}
              revealed={reveal && (mode !== 'belajar' || bukaPembahasan)}
              ragu={!!sesi.ragu[itemAktif.id]}
              onRagu={() => setSesi((s) => toggleRaguSesi(s, itemAktif.id))}
              disabled={paused}
              waktuButir={sesi.durasiButir[itemAktif.id]}
            />
          </div>

          {mode === 'belajar' && reveal && !bukaPembahasan && (
            <div class="flex flex-wrap gap-2">
              <button class="btn-secondary flex-1" onClick={() => setBukaPembahasan(true)}>
                <Icon name="book" class="h-4 w-4" /> Lihat pembahasan
              </button>
              <button class="btn-primary flex-1" onClick={lanjutBelajar}>
                Lanjut <Icon name="right" class="h-4 w-4" />
              </button>
            </div>
          )}

          {mode === 'belajar' && reveal && bukaPembahasan && (
            <ExplainPanel
              item={itemAktif}
              jawaban={sesi.jawaban[itemAktif.id] ?? null}
              onUlangi={() => {
                setSesi((s) => jawabSesi(s, itemAktif.id, null));
                setReveal(false);
              }}
              onLanjut={lanjutBelajar}
              selesai={antrean.length <= 1}
            />
          )}

          {mode !== 'belajar' && terjawab === total && sesi.indeks === total - 1 && (
            <p class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Semua butir sudah terjawab. Hasil, kesalahan, dan koreksi setiap butir ditampilkan otomatis.
            </p>
          )}

          {mode !== 'belajar' && (
            <div class="flex items-center justify-between gap-2">
              <button class="btn-secondary" onClick={() => pindah(-1)} disabled={sesi.indeks === 0}>
                <Icon name="left" class="h-4 w-4" /> Sebelumnya
              </button>
              <div class="flex gap-2">
                <button class="btn-secondary" onClick={lompatKosong}>
                  <Icon name="list" class="h-4 w-4" /> Butir kosong
                </button>
                {sesi.indeks === total - 1 ? (
                  <button class="btn-primary" onClick={() => setKonfirmasi(true)}>
                    Selesai <Icon name="check" class="h-4 w-4" />
                  </button>
                ) : (
                  <button class="btn-primary" onClick={() => pindah(1)}>
                    Berikutnya <Icon name="right" class="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {paused && (
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50">
          <div class="card text-center">
            <Icon name="pause" class="mx-auto h-8 w-8 text-slate-400" />
            <p class="mt-2 text-lg font-bold">Sesi dijeda</p>
            <p class="mt-1 text-sm text-slate-600">Waktu berhenti berjalan. Lanjutkan saat siap.</p>
            <button class="btn-primary mt-4" onClick={togglePause}>
              <Icon name="play" class="h-4 w-4" /> Lanjutkan
            </button>
          </div>
        </div>
      )}

      {konfirmasi && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div class="card w-full max-w-md">
            <h2 class="text-lg font-bold text-slate-900">Selesaikan sesi?</h2>
            <p class="mt-1 text-sm text-slate-600">
              {mode === 'belajar'
                ? `Masih ${antrean.length} butir dalam antrean belajar. Butir yang belum dikuasai tidak masuk ringkasan akhir.`
                : `Masih ${sesi.daftarItem.filter((id) => !sesi.jawaban[id]).length} butir belum dijawab. Butir kosong dihitung 0.`}
            </p>
            <div class="mt-4 flex justify-end gap-2">
              <button class="btn-secondary" onClick={() => setKonfirmasi(false)}>
                Kembali
              </button>
              <button class="btn-primary" onClick={() => selesaikan()}>
                Ya, selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
