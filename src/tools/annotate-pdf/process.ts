import { PDFDocument } from 'pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const bin = atob(dataUrl.split(',')[1] ?? '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/** Flatten the per-page ink PNGs (drawn in the panel) onto their pages. */
export const process: ProcessFn = async (files, options, onProgress) => {
  let inks: Record<string, string>;
  try {
    inks = JSON.parse(String(options.inks || '{}'));
  } catch {
    inks = {};
  }
  const pages = Object.entries(inks).filter(([, url]) => url.startsWith('data:image/png'));
  if (!pages.length) throw new Error('Draw on at least one page first — pick Pen or Highlighter and mark up the preview.');

  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  for (let i = 0; i < pages.length; i++) {
    const [num, dataUrl] = pages[i];
    const index = Number(num) - 1;
    if (index < 0 || index >= doc.getPageCount()) continue;
    const img = await doc.embedPng(dataUrlToBytes(dataUrl));
    const page = doc.getPage(index);
    const { width, height } = page.getSize();
    page.drawImage(img, { x: 0, y: 0, width, height });
    onProgress(Math.round(((i + 1) / (pages.length + 1)) * 100));
  }

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-annotated.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
