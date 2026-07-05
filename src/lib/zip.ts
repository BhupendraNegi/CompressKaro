import { zipSync } from 'fflate';

/** Zip named binary entries into a downloadable blob (runs in the worker). */
export function zipBlob(entries: Record<string, Uint8Array>): Blob {
  const zipped = zipSync(entries, { level: 6 });
  return new Blob([new Uint8Array(zipped)], { type: 'application/zip' });
}
