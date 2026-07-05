import * as pdfjs from 'pdfjs-dist';
// Vite's ?worker import gives a ready Worker constructor — handing pdfjs a
// real port avoids its own environment sniffing (which picks the flaky
// same-thread "fake worker" mode inside a worker scope).
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import type { ProgressFn } from '../../tools/types';

pdfjs.GlobalWorkerOptions.workerPort = new PdfjsWorker();

export interface RenderedPage {
  bytes: Uint8Array;
  /** Original page size in PDF points (for re-embedding at true dimensions) */
  widthPt: number;
  heightPt: number;
}

/**
 * Rasterize every page of a PDF via OffscreenCanvas (worker-safe).
 * `scale` trades pixel density for size; `quality` applies to JPEG output.
 */
export async function renderPages(
  data: ArrayBuffer,
  { scale, quality, type = 'image/jpeg' }: { scale: number; quality: number; type?: 'image/jpeg' | 'image/png' },
  onProgress: ProgressFn,
): Promise<RenderedPage[]> {
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: RenderedPage[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });
      const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas: canvas as unknown as HTMLCanvasElement, canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
      const blob = await canvas.convertToBlob({ type, quality });
      pages.push({ bytes: new Uint8Array(await blob.arrayBuffer()), widthPt: base.width, heightPt: base.height });
      page.cleanup();
      onProgress(Math.round((n / doc.numPages) * 100));
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}

/** Extract per-page text via pdfjs (worker-safe, no rendering needed). */
export async function extractText(data: ArrayBuffer, onProgress: ProgressFn): Promise<string[]> {
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
      );
      page.cleanup();
      onProgress(Math.round((n / doc.numPages) * 100));
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}
