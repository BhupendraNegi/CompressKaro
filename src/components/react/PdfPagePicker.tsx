import { useEffect, useState } from 'react';

interface Thumb {
  page: number;
  url: string;
}

import type { PanelBaseProps } from './toolPanels';

export interface PagePanelProps extends PanelBaseProps {
  /** Which option the picker reads/writes ("3, 1, 2" order or "1, 4" selection, 1-based) */
  optionKey: string;
  /** reorder: drag into a new order · select: click to toggle pages */
  mode: 'reorder' | 'select';
}

const parseSelection = (value: string): Set<number> => {
  const set = new Set<number>();
  for (const piece of value.split(',')) {
    const n = Number(piece.trim());
    if (Number.isInteger(n) && n > 0) set.add(n);
  }
  return set;
};

/**
 * pdfjs page thumbnails — the shared PDF page infrastructure. Reorder mode
 * emits "3, 1, 2" order text; select mode emits "1, 4" selection text. Both
 * bind to the tool's matching text option, so typing and clicking stay in sync.
 */
export function PdfPagePicker({ file, values, onChange, optionKey, mode }: PagePanelProps) {
  const value = String(values[optionKey] ?? '');
  const emit = (v: string) => onChange(optionKey, v);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [error, setError] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const next: Thumb[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const viewport = page.getViewport({ scale: 120 / page.getViewport({ scale: 1 }).width });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
          next.push({ page: n, url: canvas.toDataURL('image/jpeg', 0.8) });
          page.cleanup();
          if (!cancelled) setThumbs([...next]);
        }
        await doc.destroy();
      } catch {
        if (!cancelled) setError('Couldn’t render page previews — you can still type the pages below.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= thumbs.length || from === to) return;
    const next = thumbs.slice();
    const [t] = next.splice(from, 1);
    next.splice(to, 0, t);
    setThumbs(next);
    emit(next.map((t) => t.page).join(', '));
  };

  const selection = parseSelection(value);
  const toggle = (page: number) => {
    const next = new Set(selection);
    if (next.has(page)) next.delete(page);
    else next.add(page);
    emit([...next].sort((a, b) => a - b).join(', '));
  };

  if (error) return <p className="m-0 rounded-xl border border-line bg-surface2 p-3 text-[13px] text-mute">{error}</p>;
  if (!thumbs.length) return <p className="m-0 py-4 text-center text-[13px] text-mute">Rendering page previews…</p>;

  return (
    <div className="rounded-[20px] border border-line bg-surface p-[18px] shadow-card">
      <p className="mb-3 text-[13px] font-semibold tracking-[0.08em] text-mute uppercase">
        {mode === 'reorder' ? 'Pages — drag into the new order' : 'Pages — click to select'}
      </p>
      <ol className="m-0 grid list-none gap-2.5 p-0" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>
        {thumbs.map((t, i) => {
          const selected = mode === 'select' && selection.has(t.page);
          return (
            <li key={t.page}>
              {mode === 'reorder' ? (
                <div
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragEnd={() => setDragIdx(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragIdx === null || dragIdx === i) return;
                    move(dragIdx, i);
                    setDragIdx(i);
                  }}
                  className={`cursor-grab rounded-xl border p-1.5 text-center transition ${dragIdx === i ? 'border-accent bg-accent-soft' : 'border-line bg-bg'}`}
                >
                  <img src={t.url} alt={`Page ${t.page}`} className="w-full rounded-md border border-line" />
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accent-ink">{i + 1}</span>
                    <span className="text-[11px] text-mute">was p{t.page}</span>
                  </div>
                  <div className="mt-1 flex justify-center gap-1">
                    <button type="button" aria-label={`Move page ${t.page} earlier`} onClick={() => move(i, i - 1)} className="cursor-pointer rounded border-none bg-transparent px-1 text-mute hover:text-ink">←</button>
                    <button type="button" aria-label={`Move page ${t.page} later`} onClick={() => move(i, i + 1)} className="cursor-pointer rounded border-none bg-transparent px-1 text-mute hover:text-ink">→</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Page ${t.page}${selected ? ', selected' : ''}`}
                  onClick={() => toggle(t.page)}
                  className={`w-full cursor-pointer rounded-xl border p-1.5 text-center transition ${selected ? 'border-accent bg-accent-soft' : 'border-line bg-bg hover:border-accent'}`}
                >
                  <img src={t.url} alt="" className="w-full rounded-md border border-line" />
                  <span className={`mt-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-md px-1 text-[10px] font-bold ${selected ? 'bg-accent text-accent-ink' : 'bg-surface2 text-mute'}`}>
                    {t.page}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
