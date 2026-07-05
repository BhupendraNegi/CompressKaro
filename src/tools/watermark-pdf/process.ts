import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Stamp a text watermark on every page: diagonal, centered, or bottom. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const text = String(options.wm ?? '').trim();
  if (!text) throw new Error('Enter the watermark text (e.g. CONFIDENTIAL).');
  const opacity = Number(options.op ?? 25) / 100;
  const pos = String(options.pos ?? 'Diagonal');

  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  pages.forEach((page, i) => {
    const { width: pw, height: ph } = page.getSize();
    const size = pos === 'Bottom' ? Math.max(10, pw / 30) : Math.min(pw / (text.length * 0.62), pw / 6);
    const textWidth = font.widthOfTextAtSize(text, size);
    const common = { font, size, color: rgb(0.35, 0.35, 0.35), opacity };

    if (pos === 'Diagonal') {
      page.drawText(text, {
        ...common,
        x: pw / 2 - (textWidth / 2) * Math.cos(Math.PI / 4),
        y: ph / 2 - (textWidth / 2) * Math.sin(Math.PI / 4),
        rotate: degrees(45),
      });
    } else if (pos === 'Center') {
      page.drawText(text, { ...common, x: (pw - textWidth) / 2, y: ph / 2 - size / 2 });
    } else {
      page.drawText(text, { ...common, x: (pw - textWidth) / 2, y: 24 });
    }
    onProgress(Math.round(((i + 1) / (pages.length + 1)) * 100));
  });

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-watermarked.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
