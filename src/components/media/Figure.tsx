import { useEffect, useState } from 'preact/hooks';
import Icon from '../ui/Icon';

export default function Figure({
  src,
  alt = 'Gambar stimulus',
  caption,
}: {
  src: string;
  alt?: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(3, z + 0.25));
      if (e.key === '-') setZoom((z) => Math.max(1, z - 0.25));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <figure class="my-3">
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setOpen(true);
          }}
          class="group relative block w-full overflow-hidden rounded-lg border border-slate-200 bg-white"
          aria-label="Perbesar gambar"
        >
          <img
            src={src}
            alt={alt}
            class="mx-auto max-h-[45vh] w-auto max-w-full object-contain"
            loading="eager"
          />
          <span class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
            <Icon name="zoom" class="h-3.5 w-3.5" /> Perbesar
          </span>
        </button>
        {caption && <figcaption class="mt-1.5 text-center text-xs text-slate-500">{caption}</figcaption>}
      </figure>

      {open && (
        <div
          class="fixed inset-0 z-50 flex flex-col bg-slate-900/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div class="mb-2 flex items-center justify-between text-white">
            <span class="text-sm opacity-80">{alt}</span>
            <div class="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                class="rounded-md bg-white/10 px-2.5 py-1 text-sm hover:bg-white/20"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              >
                −
              </button>
              <span class="w-14 text-center text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                class="rounded-md bg-white/10 px-2.5 py-1 text-sm hover:bg-white/20"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              >
                +
              </button>
              <button
                class="ml-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                <Icon name="x" class="h-4 w-4" /> Tutup
              </button>
            </div>
          </div>
          <div
            class="flex flex-1 items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              class="max-h-full max-w-full transition-transform duration-150"
            />
          </div>
        </div>
      )}
    </>
  );
}
