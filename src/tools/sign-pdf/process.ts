import { PDFDocument } from 'pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

interface Placement {
  page: number;
  /** Signature center as fractions of page size, measured from the top-left */
  x: number;
  y: number;
  /** Signature width as a fraction of page width */
  w: number;
}

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(',')[1] ?? '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/** Stamp the signature PNG at the clicked position (preview → PDF coords). */
export const process: ProcessFn = async (files, options, onProgress) => {
  const sig = String(options.sig ?? '');
  if (!sig.startsWith('data:image/png')) throw new Error('Draw or type your signature first.');
  let placement: Placement;
  try {
    placement = JSON.parse(String(options.placement || ''));
  } catch {
    placement = { page: 0, x: NaN, y: NaN, w: 0.3 };
  }
  if (!Number.isFinite(placement.x)) throw new Error('Click the page preview to place your signature.');

  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  const img = await doc.embedPng(dataUrlToBytes(sig));
  onProgress(40);

  const pageIndex = Math.min(Math.max(1, placement.page || 1), doc.getPageCount()) - 1;
  const page = doc.getPage(pageIndex);
  const { width: pw, height: ph } = page.getSize();

  // Preview coords are top-left fractions of the signature center; PDF space
  // has a bottom-left origin, so flip y.
  const w = placement.w * pw;
  const h = w * (img.height / img.width);
  page.drawImage(img, {
    x: placement.x * pw - w / 2,
    y: ph - placement.y * ph - h / 2,
    width: w,
    height: h,
  });
  onProgress(80);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-signed.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
