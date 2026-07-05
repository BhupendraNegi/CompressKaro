import { useEffect, useRef, useState } from 'react';
import type { PanelBaseProps } from './toolPanels';

/**
 * Sign PDF panel: draw or type a signature, then click the page preview to
 * place it — drag to reposition, slider to resize. Writes two options:
 *   sig       — PNG data URL of the signature
 *   placement — JSON {page, x, y, w} with x/y as fractions from the top-left
 *               (center of the signature) and w as a fraction of page width
 */
export function SignPanel({ file, values, onChange }: PanelBaseProps) {
  const [tab, setTab] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [preview, setPreview] = useState('');
  const [hasInk, setHasInk] = useState(false);
  const padRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const dragging = useRef(false);

  const placement = (() => {
    try {
      return JSON.parse(String(values.placement || '{}')) as { page?: number; x?: number; y?: number; w?: number };
    } catch {
      return {};
    }
  })();
  const sig = String(values.sig ?? '');

  // Render the chosen page as the placement preview.
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
        if (!cancelled) setPreview(canvas.toDataURL('image/jpeg', 0.85));
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

  // Signature pad wiring.
  const padPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const emitPadSig = () => {
    const canvas = padRef.current;
    if (canvas) onChange('sig', canvas.toDataURL('image/png'));
  };

  const clearPad = () => {
    const canvas = padRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange('sig', '');
  };

  // Typed mode: render the name in an italic serif onto a canvas → PNG.
  const emitTypedSig = (name: string) => {
    setTyped(name);
    if (!name.trim()) {
      onChange('sig', '');
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const font = 'italic 64px "Instrument Serif", Georgia, serif';
    ctx.font = font;
    canvas.width = Math.ceil(ctx.measureText(name).width) + 40;
    canvas.height = 100;
    const ctx2 = canvas.getContext('2d')!;
    ctx2.font = font;
    ctx2.fillStyle = '#1d3557';
    ctx2.fillText(name, 20, 68);
    onChange('sig', canvas.toDataURL('image/png'));
  };

  const place = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = previewRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onChange('placement', JSON.stringify({ page: pageNum, x, y, w: placement.w ?? 0.3 }));
  };

  const widthFrac = placement.w ?? 0.3;

  return (
    <div className="flex flex-col gap-4">
      {/* Signature source */}
      <div className="rounded-[20px] border border-line bg-surface p-[18px] shadow-card">
        <p className="mb-3 text-[13px] font-semibold tracking-[0.08em] text-mute uppercase">Your signature</p>
        <div className="mb-3 flex gap-2" role="tablist">
          {(['draw', 'type'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium ${tab === t ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-ink'}`}
            >
              {t === 'draw' ? 'Draw' : 'Type'}
            </button>
          ))}
        </div>
        {tab === 'draw' ? (
          <div>
            <canvas
              ref={padRef}
              width={560}
              height={160}
              aria-label="Signature pad — draw with your mouse or finger"
              className="w-full touch-none rounded-xl border border-dashed border-line bg-bg"
              onPointerDown={(e) => {
                drawing.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                const ctx = e.currentTarget.getContext('2d')!;
                const { x, y } = padPos(e);
                ctx.beginPath();
                ctx.moveTo(x, y);
              }}
              onPointerMove={(e) => {
                if (!drawing.current) return;
                const ctx = e.currentTarget.getContext('2d')!;
                ctx.strokeStyle = '#1d3557';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                const { x, y } = padPos(e);
                ctx.lineTo(x, y);
                ctx.stroke();
                setHasInk(true);
              }}
              onPointerUp={() => {
                drawing.current = false;
                emitPadSig();
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="m-0 text-[12.5px] text-mute">Sign above with your mouse or finger.</p>
              {hasInk && (
                <button type="button" onClick={clearPad} className="cursor-pointer border-none bg-transparent text-[13px] font-medium text-accent">
                  Clear
                </button>
              )}
            </div>
          </div>
        ) : (
          <input
            type="text"
            value={typed}
            onChange={(e) => emitTypedSig(e.target.value)}
            placeholder="e.g. Priya Sharma"
            aria-label="Type your name to generate a signature"
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-[11px] font-serif text-xl italic text-ink outline-none focus:border-accent"
          />
        )}
      </div>

      {/* Placement */}
      <div className="rounded-[20px] border border-line bg-surface p-[18px] shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="m-0 text-[13px] font-semibold tracking-[0.08em] text-mute uppercase">Click the page to place it</p>
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
        {preview ? (
          <div
            ref={previewRef}
            className="relative mx-auto max-w-[560px] cursor-crosshair overflow-hidden rounded-lg border border-line select-none"
            onPointerDown={(e) => {
              dragging.current = true;
              place(e);
            }}
            onPointerMove={(e) => dragging.current && place(e)}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerLeave={() => {
              dragging.current = false;
            }}
          >
            <img src={preview} alt={`Page ${pageNum} preview`} className="block w-full" draggable={false} />
            {sig && placement.x !== undefined && placement.page === pageNum && (
              <img
                src={sig}
                alt="Signature placement"
                draggable={false}
                className="pointer-events-none absolute border border-dashed border-accent"
                style={{
                  width: `${widthFrac * 100}%`,
                  left: `${placement.x! * 100}%`,
                  top: `${placement.y! * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </div>
        ) : (
          <p className="m-0 py-4 text-center text-[13px] text-mute">Rendering page preview…</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="sig-size" className="text-sm font-semibold">
            Size
          </label>
          <input
            id="sig-size"
            type="range"
            min={10}
            max={60}
            value={Math.round(widthFrac * 100)}
            onChange={(e) => onChange('placement', JSON.stringify({ page: placement.page ?? pageNum, x: placement.x ?? 0.5, y: placement.y ?? 0.8, w: Number(e.target.value) / 100 }))}
            className="flex-1 cursor-pointer accent-accent"
          />
          <span className="text-[13px] font-medium text-accent">{Math.round(widthFrac * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
