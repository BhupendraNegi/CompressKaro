import { extensionFor, outputTypeFor } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import type { ProcessFn, ToolOutput } from '../types';

/** Stamp text on photos: bottom-right, centered, or tiled diagonally. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const text = String(options.wm ?? '').trim();
  if (!text) throw new Error('Enter the watermark text (e.g. © Your Name).');
  const opacity = Number(options.op ?? 40) / 100;
  const pos = String(options.pos ?? 'Bottom right');

  const outputs: ToolOutput[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const size = Math.max(14, Math.round(canvas.width / 24));
    ctx.font = `600 ${size}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.6})`;
    ctx.lineWidth = Math.max(1, size / 16);

    const stamp = (x: number, y: number) => {
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    };

    const metrics = ctx.measureText(text);
    if (pos === 'Center') {
      stamp((canvas.width - metrics.width) / 2, canvas.height / 2);
    } else if (pos === 'Tile') {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      const stepX = metrics.width + size * 4;
      const stepY = size * 6;
      const span = Math.max(canvas.width, canvas.height);
      for (let y = -span; y <= span; y += stepY) {
        for (let x = -span; x <= span; x += stepX) stamp(x, y);
      }
      ctx.restore();
    } else {
      stamp(canvas.width - metrics.width - size, canvas.height - size);
    }

    const type = outputTypeFor(file);
    const blob = await canvas.convertToBlob({ type, quality: 0.92 });
    outputs.push({ name: `${baseName(file.name)}-watermarked.${extensionFor(type)}`, blob });
    onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return outputs;
};
