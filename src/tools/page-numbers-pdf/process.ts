import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const MARGIN = 28;
const SIZE = 10;

/** Stamp a page number on every page in the chosen position and format. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const pos = String(options.pos ?? 'Bottom center');
  const fmt = String(options.fmt ?? '1, 2, 3');

  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  const label = (n: number): string =>
    fmt === 'Page 1 of N' ? `Page ${n} of ${total}` : fmt === '– 1 –' ? `– ${n} –` : String(n);

  pages.forEach((page, i) => {
    const { width: pw, height: ph } = page.getSize();
    const text = label(i + 1);
    const textWidth = font.widthOfTextAtSize(text, SIZE);
    const x = pos === 'Bottom center' ? (pw - textWidth) / 2 : pw - MARGIN - textWidth;
    const y = pos === 'Top right' ? ph - MARGIN : MARGIN - SIZE / 2;
    page.drawText(text, { x, y, size: SIZE, font, color: rgb(0.3, 0.3, 0.3) });
    onProgress(Math.round(((i + 1) / (total + 1)) * 100));
  });

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-numbered.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
