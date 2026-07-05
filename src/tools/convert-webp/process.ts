import { transformImage } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import type { ProcessFn, ToolOutput } from '../types';

/** Convert each image to WebP at the chosen quality. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const quality = Number(options.q ?? 80) / 100;
  const outputs: ToolOutput[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await transformImage(files[i], { type: 'image/webp', quality });
    outputs.push({ name: `${baseName(files[i].name)}.webp`, blob });
    onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return outputs;
};
