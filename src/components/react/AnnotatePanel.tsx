import { useEffect, useRef, useState } from 'react';
import type { PanelBaseProps } from './toolPanels';

const COLORS: Record<string, string> = { Red: '#d9342f', Blue: '#1d4ed8', Black: '#1d1a17' };

/**
 * Annotate PDF panel: draw directly on the page preview with a pen or a
 * translucent highlighter. Strokes per page are stored as transparent PNGs in
 * the `inks` option — JSON { "<pageNum>": dataURL } — and flattened in the worker.
 */
export function AnnotatePanel({ file, values, onChange }: PanelBaseProps) {
  const [pageCount, setPageCount] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [preview, setPreview] = useState('');
  const inkRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const tool = String(values.tool ?? 'Pen');
  const color = COLORS[String(values.color ?? 'Red')] ?? COLORS.Red;

  const inks = (() => {
    try {
      return JSON.parse(String(values.inks || '{}')) as Record<string, string>;
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        if (!cancelled) setPageCount(doc.numPages);
        const page = await doc.getPage(Math.min(pageNum, doc.numPages));
        const viewport = page.getViewport({ scale: 560 / page.getViewport({ scale: 1 }).width });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
        if (cancelled) return;
        setPreview(canvas.toDataURL('image/jpeg', 0.85));
        // Match the ink canvas to the page and restore existing strokes.
        const ink = inkRef.current;
        if (ink) {
          ink.width = canvas.width;
          ink.height = canvas.height;
          const saved = inks[String(pageNum)];
          if (saved) {
            const img = new Image();
            img.onload = () => ink.getContext('2d')!.drawImage(img, 0, 0);
            img.src = saved;
          }
        }
        page.cleanup();
        await doc.destroy();
      } catch {
        if (!cancelled) setPreview('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, pageNum]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const saveInk = () => {
    const ink = inkRef.current;
    if (!ink) return;
    onChange('inks', JSON.stringify({ ...inks, [String(pageNum)]: ink.toDataURL('image/png') }));
  };

  const clearPage = () => {
    const ink = inkRef.current;
    if (!ink) return;
    ink.getContext('2d')!.clearRect(0, 0, ink.width, ink.height);
    const next = { ...inks };
    delete next[String(pageNum)];
    onChange('inks', JSON.stringify(next));
  };

  return (
    <div className="rounded-[20px] border border-line bg-surface p-[18px] shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 text-[13px] font-semibold tracking-[0.08em] text-mute uppercase">Draw on the page</p>
        <div className="flex items-center gap-3">
          {inks[String(pageNum)] && (
            <button type="button" onClick={clearPage} className="cursor-pointer border-none bg-transparent text-[13px] font-medium text-accent">
              Clear page
            </button>
          )}
          {pageCount > 1 && (
            <label className="flex items-center gap-2 text-[13px] text-mute">
              Page
              <input
                type="number"
                min={1}
                max={pageCount}
                value={pageNum}
                onChange={(e) => setPageNum(Math.min(pageCount, Math.max(1, Number(e.target.value) || 1)))}
                className="w-16 rounded-lg border border-line bg-bg px-2 py-1 text-ink"
              />
              of {pageCount}
            </label>
          )}
        </div>
      </div>
      {preview ? (
        <div className="relative mx-auto max-w-[560px] overflow-hidden rounded-lg border border-line select-none">
          <img src={preview} alt={`Page ${pageNum} preview`} className="block w-full" draggable={false} />
          <canvas
            ref={inkRef}
            aria-label={`Annotation canvas for page ${pageNum} — draw with your mouse or finger`}
            className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
            onPointerDown={(e) => {
              drawing.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              const ctx = e.currentTarget.getContext('2d')!;
              const { x, y } = pos(e);
              ctx.beginPath();
              ctx.moveTo(x, y);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const ctx = e.currentTarget.getContext('2d')!;
              if (tool === 'Highlighter') {
                ctx.strokeStyle = 'rgba(255, 220, 0, 0.35)';
                ctx.lineWidth = 16;
              } else {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
              }
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              const { x, y } = pos(e);
              ctx.lineTo(x, y);
              ctx.stroke();
            }}
            onPointerUp={() => {
              drawing.current = false;
              saveInk();
            }}
          />
        </div>
      ) : (
        <p className="m-0 py-4 text-center text-[13px] text-mute">Rendering page preview…</p>
      )}
      <p className="mt-2 mb-0 text-[12.5px] text-mute">
        Annotated pages: {Object.keys(inks).length ? Object.keys(inks).sort((a, b) => Number(a) - Number(b)).join(', ') : 'none yet'}
      </p>
    </div>
  );
}
