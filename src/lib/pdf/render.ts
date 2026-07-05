import * as pdfjs from 'pdfjs-dist';
import type { ProgressFn } from '../../tools/types';

// pdfjs spawns its own (nested) worker; Vite bundles the asset URL.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export interface RenderedPage {
  jpeg: Uint8Array;
  /** Original page size in PDF points (for re-embedding at true dimensions) */
  widthPt: number;
  heightPt: number;
}

/**
 * Rasterize every page of a PDF to JPEG via OffscreenCanvas (worker-safe).
 * `scale` trades pixel density for size; `quality` is the JPEG quality 0–1.
 */
export async function renderPagesToJpeg(
  data: ArrayBuffer,
  { scale, quality }: { scale: number; quality: number },
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
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      pages.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), widthPt: base.width, heightPt: base.height });
      page.cleanup();
      onProgress(Math.round((n / doc.numPages) * 100));
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}
