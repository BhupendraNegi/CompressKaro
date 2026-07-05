import { PDFDocument } from 'pdf-lib';
import { parsePages } from '../../lib/pdf/ranges';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Copy the selected pages into a new PDF (original order). */
export const process: ProcessFn = async (files, options, onProgress) => {
  const src = await PDFDocument.load(await files[0].arrayBuffer());
  const selected = parsePages(String(options.pages ?? ''), src.getPageCount());
  if (!selected.length) throw new Error('Select the pages to extract — click the thumbnails or type them (e.g. 1, 4-6).');
  onProgress(30);

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, selected);
  for (const p of pages) doc.addPage(p);
  onProgress(80);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-extracted.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
