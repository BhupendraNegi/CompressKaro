import { PDFDocument } from 'pdf-lib';
import { parsePages } from '../../lib/pdf/ranges';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Remove the selected pages; the rest keep their order. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const src = await PDFDocument.load(await files[0].arrayBuffer());
  const remove = new Set(parsePages(String(options.pages ?? ''), src.getPageCount()));
  if (!remove.size) throw new Error('Select the pages to delete — click the thumbnails or type them (e.g. 2, 7-9).');
  const keep = src.getPageIndices().filter((i) => !remove.has(i));
  if (!keep.length) throw new Error('You can’t delete every page — at least one must remain.');
  onProgress(30);

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, keep);
  for (const p of pages) doc.addPage(p);
  onProgress(80);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-deleted.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
