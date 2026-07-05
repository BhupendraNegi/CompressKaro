import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const MARGIN = 24;
const SIZE = 9;

/** Add running header/footer text centered on every page. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const header = String(options.h ?? '').trim();
  const footer = String(options.f ?? '').trim();
  if (!header && !footer) throw new Error('Enter a header, a footer, or both.');

  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  pages.forEach((page, i) => {
    const { width: pw, height: ph } = page.getSize();
    const common = { size: SIZE, font, color: rgb(0.3, 0.3, 0.3) };
    if (header) page.drawText(header, { ...common, x: (pw - font.widthOfTextAtSize(header, SIZE)) / 2, y: ph - MARGIN });
    if (footer) page.drawText(footer, { ...common, x: (pw - font.widthOfTextAtSize(footer, SIZE)) / 2, y: MARGIN - SIZE / 2 });
    onProgress(Math.round(((i + 1) / (pages.length + 1)) * 100));
  });

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-hf.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
