import { useEffect, useState } from 'react';

interface Thumb {
  page: number;
  url: string;
}

export interface PagePanelProps {
  file: File;
  /** Current value of the tool's order option ("3, 1, 2" style, 1-based) */
  value: string;
  onChange: (order: string) => void;
}

/**
 * pdfjs page thumbnails with drag-to-reorder (shared PDF page infrastructure).
 * Emits the visual order as the same "3, 1, 2" text the order option accepts.
 */
export function PdfPagePicker({ file, onChange }: PagePanelProps) {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [error, setError] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
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
          const url = canvas.toDataURL('image/jpeg', 0.8);
          urls.push(url);
          next.push({ page: n, url });
          page.cleanup();
          if (!cancelled) setThumbs([...next]);
        }
        await doc.destroy();
      } catch {
        if (!cancelled) setError('Couldn’t render page previews — you can still type the page order below.');
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
    onChange(next.map((t) => t.page).join(', '));
  };

  if (error) return <p className="m-0 rounded-xl border border-line bg-surface2 p-3 text-[13px] text-mute">{error}</p>;
  if (!thumbs.length) return <p className="m-0 py-4 text-center text-[13px] text-mute">Rendering page previews…</p>;

  return (
    <div className="rounded-[20px] border border-line bg-surface p-[18px] shadow-card">
      <p className="mb-3 text-[13px] font-semibold tracking-[0.08em] text-mute uppercase">Pages — drag into the new order</p>
      <ol className="m-0 grid list-none gap-2.5 p-0" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>
        {thumbs.map((t, i) => (
          <li
            key={t.page}
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
          </li>
        ))}
      </ol>
    </div>
  );
}
