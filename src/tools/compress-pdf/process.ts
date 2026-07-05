import { PDFDocument } from 'pdf-lib';
import { renderPagesToJpeg } from '../../lib/pdf/render';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const LEVELS: Record<number, { scale: number; quality: number }> = {
  1: { scale: 1.5, quality: 0.75 }, // Light
  2: { scale: 1.2, quality: 0.6 }, // Balanced
  3: { scale: 1.0, quality: 0.45 }, // Strong
};

async function rebuild(data: ArrayBuffer, scale: number, quality: number, onProgress: (p: number) => void): Promise<Uint8Array> {
  const pages = await renderPagesToJpeg(data, { scale, quality }, (p) => onProgress(Math.round(p * 0.85)));
  const doc = await PDFDocument.create();
  for (const page of pages) {
    const img = await doc.embedJpg(page.jpeg);
    doc.addPage([page.widthPt, page.heightPt]).drawImage(img, { x: 0, y: 0, width: page.widthPt, height: page.heightPt });
  }
  onProgress(95);
  return doc.save();
}

/** Re-render every page via canvas at reduced quality/scale for real size cuts. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const data = await files[0].arrayBuffer();
  const level = LEVELS[Number(options.level ?? 2)] ?? LEVELS[2];
  const target = Number(options.target);
  const targetBytes = Number.isFinite(target) && target > 0 ? target * 1024 : undefined;

  let out = await rebuild(data, level.scale, level.quality, onProgress);

  if (targetBytes) {
    let { scale, quality } = level;
    for (let attempt = 0; out.length > targetBytes && attempt < 3; attempt++) {
      quality = Math.max(0.2, quality * 0.6);
      scale = Math.max(0.5, scale * 0.85);
      const next = await rebuild(data, scale, quality, onProgress);
      if (next.length >= out.length) break;
      out = next;
    }
  }

  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-compressed.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
