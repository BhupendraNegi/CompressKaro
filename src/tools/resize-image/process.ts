import { extensionFor, outputTypeFor, transformImage } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Resize to exact pixels; leave one dimension blank to keep aspect ratio. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const width = Number(options.w) || 0;
  const height = Number(options.h) || 0;
  if (!width && !height) throw new Error('Enter a width or a height (or both) in pixels.');

  const type = outputTypeFor(files[0]);
  const blob = await transformImage(files[0], { width, height, type, quality: 0.92 });
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-resized.${extensionFor(type)}`, blob }];
};
