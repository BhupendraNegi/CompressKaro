import { PDFDocument } from 'pdf-lib';
import { parsePages } from '../../lib/pdf/ranges';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const MM_TO_PT = 72 / 25.4;

/** Trim an even margin (mm) off all pages, or only the selected ones. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  const marginPt = Number(options.margin ?? 10) * MM_TO_PT;
  const selected = parsePages(String(options.pages ?? ''), doc.getPageCount());
  const targets = selected.length ? selected : doc.getPageIndices();
  onProgress(30);

  for (const i of targets) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const w = width - marginPt * 2;
    const h = height - marginPt * 2;
    if (w <= 0 || h <= 0) throw new Error(`A ${options.margin} mm margin is larger than page ${i + 1} — pick a smaller trim.`);
    page.setCropBox(marginPt, marginPt, w, h);
  }
  onProgress(70);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-cropped.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
