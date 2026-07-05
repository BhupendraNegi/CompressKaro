import { PDFDocument, degrees } from 'pdf-lib';
import { parsePages } from '../../lib/pdf/ranges';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const ANGLES: Record<string, number> = { '90° right': 90, '180°': 180, '90° left': 270 };

/** Rotate all pages, or only the selected ones, by 90/180/270 degrees. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  const delta = ANGLES[String(options.angle ?? '90° right')] ?? 90;
  const selected = parsePages(String(options.pages ?? ''), doc.getPageCount());
  const targets = selected.length ? selected : doc.getPageIndices();
  onProgress(30);

  for (const i of targets) {
    const page = doc.getPage(i);
    page.setRotation(degrees((page.getRotation().angle + delta) % 360));
  }
  onProgress(70);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-rotated.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
