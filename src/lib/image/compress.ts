import type { ProgressFn } from '../../tools/types';

export interface CompressOptions {
  /** 10–100 quality when no target is set */
  quality: number;
  /** Optional target size in KB — iteratively compress until at/under it */
  targetKb?: number;
}

/**
 * Compress an image to JPEG via OffscreenCanvas (worker-safe). Output is
 * always JPEG, matching the design's `{base}-compressed.jpg` contract —
 * transparency is flattened onto white.
 *
 * Target mode (the spec's critical feature): binary-search the JPEG quality
 * for the largest result at/under the target; if even the lowest quality is
 * too big, progressively downscale dimensions.
 */
export async function compressImage(
  file: File,
  { quality, targetKb }: CompressOptions,
  onProgress: ProgressFn,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;

  const encode = (w: number, h: number, q: number): Promise<Blob> => {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.convertToBlob({ type: 'image/jpeg', quality: q });
  };

  try {
    if (!targetKb) {
      const blob = await encode(width, height, quality / 100);
      onProgress(100);
      return blob;
    }

    const targetBytes = targetKb * 1024;
    const qualitySteps = 7;
    const scaleSteps = 4;
    const totalSteps = qualitySteps + scaleSteps;
    let step = 0;
    const tick = () => onProgress(Math.min(99, Math.round((++step / totalSteps) * 100)));

    for (let scale = 0; scale <= scaleSteps; scale++) {
      let lo = 0.05;
      let hi = 0.95;
      let best: Blob | null = null;
      for (let i = 0; i < qualitySteps; i++) {
        const mid = (lo + hi) / 2;
        const blob = await encode(width, height, mid);
        if (blob.size <= targetBytes) {
          best = blob;
          lo = mid;
        } else {
          hi = mid;
        }
        tick();
      }
      if (best) {
        onProgress(100);
        return best;
      }
      // Even minimum quality is too big — shrink dimensions and retry.
      width = Math.max(1, Math.round(width * 0.7071));
      height = Math.max(1, Math.round(height * 0.7071));
      tick();
    }

    // Give the smallest we can produce rather than failing.
    const fallback = await encode(width, height, 0.05);
    onProgress(100);
    return fallback;
  } finally {
    bitmap.close();
  }
}
