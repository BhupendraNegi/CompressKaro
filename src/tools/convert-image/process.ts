import { extensionFor, transformImage, type ImageType } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import type { ProcessFn, ToolOutput } from '../types';

const TYPES: Record<string, ImageType> = { JPG: 'image/jpeg', PNG: 'image/png', WebP: 'image/webp' };

/** Convert each image to the chosen format. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const type = TYPES[String(options.fmt ?? 'JPG')] ?? 'image/jpeg';
  const outputs: ToolOutput[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await transformImage(files[i], { type, quality: 0.92 });
    outputs.push({ name: `${baseName(files[i].name)}.${extensionFor(type)}`, blob });
    onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return outputs;
};
