import { PDFDocument } from 'pdf-lib';
import type { ProcessFn } from '../types';

/** Merge PDFs in list order into one document. */
export const process: ProcessFn = async (files, _options, onProgress) => {
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const bytes = await files[i].arrayBuffer();
    const src = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    for (const page of pages) merged.addPage(page);
    onProgress(Math.round(((i + 1) / (files.length + 1)) * 100));
  }

  const out = await merged.save();
  onProgress(100);
  return [{ name: 'merged.pdf', blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
