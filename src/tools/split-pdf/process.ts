import { PDFDocument } from 'pdf-lib';
import { parseRanges } from '../../lib/pdf/ranges';
import { baseName } from '../../lib/files';
import { zipBlob } from '../../lib/zip';
import type { ProcessFn } from '../types';

/** Split by page ranges (each range → one PDF); blank ranges → every page. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const src = await PDFDocument.load(await files[0].arrayBuffer());
  const ranges = parseRanges(String(options.ranges ?? ''), src.getPageCount());
  const base = baseName(files[0].name);

  const entries: Record<string, Uint8Array> = {};
  for (let i = 0; i < ranges.length; i++) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, ranges[i]);
    for (const p of pages) doc.addPage(p);
    const first = ranges[i][0] + 1;
    const last = ranges[i][ranges[i].length - 1] + 1;
    const label = first === last ? `page-${first}` : `pages-${first}-${last}`;
    entries[`${base}-${label}.pdf`] = await doc.save();
    onProgress(Math.round(((i + 1) / (ranges.length + 1)) * 100));
  }

  const blob = zipBlob(entries);
  onProgress(100);
  return [{ name: `${base}-split.zip`, blob }];
};
