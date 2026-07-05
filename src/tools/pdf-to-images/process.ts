import { renderPages } from '../../lib/pdf/render';
import { baseName } from '../../lib/files';
import { zipBlob } from '../../lib/zip';
import type { ProcessFn } from '../types';

/** Export every page as PNG/JPG; multiple pages arrive zipped. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const png = String(options.fmt ?? 'PNG') === 'PNG';
  const ext = png ? 'png' : 'jpg';
  const quality = Number(options.q ?? 90) / 100;
  const base = baseName(files[0].name);

  const pages = await renderPages(
    await files[0].arrayBuffer(),
    { scale: 2, quality, type: png ? 'image/png' : 'image/jpeg' },
    (p) => onProgress(Math.round(p * 0.9)),
  );

  if (pages.length === 1) {
    onProgress(100);
    return [{ name: `${base}-page-1.${ext}`, blob: new Blob([new Uint8Array(pages[0].bytes)], { type: png ? 'image/png' : 'image/jpeg' }) }];
  }

  const entries: Record<string, Uint8Array> = {};
  pages.forEach((p, i) => {
    entries[`${base}-page-${i + 1}.${ext}`] = p.bytes;
  });
  const blob = zipBlob(entries);
  onProgress(100);
  return [{ name: `${base}-pages.zip`, blob }];
};
