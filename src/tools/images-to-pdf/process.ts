import { PDFDocument, type PDFImage } from 'pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
};
const MARGIN = 24;
const PX_TO_PT = 72 / 96;

/** Decode any browser-supported image to JPEG bytes (for WebP etc.). */
async function toJpeg(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
  return new Uint8Array(await blob.arrayBuffer());
}

/** One page per image; A4/Letter with margins, or page fit to the image. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const sizeOpt = String(options.size ?? 'A4');
  const orient = String(options.orient ?? 'Auto');
  const doc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let img: PDFImage;
    if (file.type === 'image/jpeg') img = await doc.embedJpg(await file.arrayBuffer());
    else if (file.type === 'image/png') img = await doc.embedPng(await file.arrayBuffer());
    else img = await doc.embedJpg(await toJpeg(file));

    if (sizeOpt === 'Fit image') {
      const w = img.width * PX_TO_PT;
      const h = img.height * PX_TO_PT;
      doc.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
    } else {
      let [w, h] = PAGE_SIZES[sizeOpt] ?? PAGE_SIZES.A4;
      const landscape = orient === 'Landscape' || (orient === 'Auto' && img.width > img.height);
      if (landscape) [w, h] = [h, w];
      const page = doc.addPage([w, h]);
      const maxW = w - MARGIN * 2;
      const maxH = h - MARGIN * 2;
      const k = Math.min(maxW / img.width, maxH / img.height);
      const dw = img.width * k;
      const dh = img.height * k;
      page.drawImage(img, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
    }
    onProgress(Math.round(((i + 1) / (files.length + 1)) * 100));
  }

  const out = await doc.save();
  onProgress(100);
  const name = files.length === 1 ? `${baseName(files[0].name)}.pdf` : 'images.pdf';
  return [{ name, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
