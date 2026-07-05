/** Shared decode → transform → encode pipeline for the image tools (worker-safe). */

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface TransformOptions {
  /** Target width/height in px; leave one 0/undefined to keep aspect ratio */
  width?: number;
  height?: number;
  /** Clockwise rotation */
  rotate?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  /** Center-crop to width/height ratio (e.g. 1, 4/3, 16/9) before resizing */
  cropRatio?: number;
  type: ImageType;
  /** 0–1, applies to jpeg/webp */
  quality?: number;
}

export const extensionFor = (type: ImageType): string =>
  type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';

/** Map a source file's type to a sensible output type (unknown → jpeg). */
export const outputTypeFor = (file: File): ImageType =>
  file.type === 'image/png' || file.type === 'image/webp' ? (file.type as ImageType) : 'image/jpeg';

export async function transformImage(file: File, opts: TransformOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    // 1. Center-crop region in source pixels.
    let sx = 0;
    let sy = 0;
    let sw = bitmap.width;
    let sh = bitmap.height;
    if (opts.cropRatio) {
      const current = sw / sh;
      if (current > opts.cropRatio) {
        sw = Math.round(sh * opts.cropRatio);
        sx = Math.round((bitmap.width - sw) / 2);
      } else {
        sh = Math.round(sw / opts.cropRatio);
        sy = Math.round((bitmap.height - sh) / 2);
      }
    }

    // 2. Output size (pre-rotation), keeping aspect when one side is missing.
    let dw = opts.width || 0;
    let dh = opts.height || 0;
    if (!dw && !dh) {
      dw = sw;
      dh = sh;
    } else if (!dw) {
      dw = Math.max(1, Math.round((dh * sw) / sh));
    } else if (!dh) {
      dh = Math.max(1, Math.round((dw * sh) / sw));
    }

    // 3. Canvas sized for the rotation; draw with flips applied.
    const rot = opts.rotate ?? 0;
    const swap = rot === 90 || rot === 270;
    const canvas = new OffscreenCanvas(swap ? dh : dw, swap ? dw : dh);
    const ctx = canvas.getContext('2d')!;
    if (opts.type === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
    ctx.drawImage(bitmap, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);

    return await canvas.convertToBlob({ type: opts.type, quality: opts.quality });
  } finally {
    bitmap.close();
  }
}
