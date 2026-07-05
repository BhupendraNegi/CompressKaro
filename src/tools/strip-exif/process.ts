import { extensionFor, outputTypeFor, transformImage } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import type { ProcessFn, ToolOutput } from '../types';

/**
 * Re-encode via canvas — pixels survive, metadata (EXIF, GPS, camera info)
 * does not. The privacy tool in one line.
 */
export const process: ProcessFn = async (files, _options, onProgress) => {
  const outputs: ToolOutput[] = [];
  for (let i = 0; i < files.length; i++) {
    const type = outputTypeFor(files[i]);
    const blob = await transformImage(files[i], { type, quality: 0.95 });
    outputs.push({ name: `${baseName(files[i].name)}-clean.${extensionFor(type)}`, blob });
    onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return outputs;
};
