import { PDFDocument } from 'pdf-lib';
import { parseOrder } from '../../lib/pdf/ranges';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Rebuild the PDF with pages in the requested order (from thumbnails or text). */
export const process: ProcessFn = async (files, options, onProgress) => {
  const src = await PDFDocument.load(await files[0].arrayBuffer());
  const order = parseOrder(String(options.order ?? ''), src.getPageCount());
  onProgress(30);

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, order);
  for (const p of pages) doc.addPage(p);
  onProgress(80);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-reordered.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
