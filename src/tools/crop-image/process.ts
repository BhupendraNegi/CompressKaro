import { extensionFor, outputTypeFor, transformImage } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const RATIOS: Record<string, number | undefined> = {
  Free: undefined,
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  Passport: 35 / 45,
};

/** Center-crop to a fixed ratio (drawn crop box lands with the overlay infra). */
export const process: ProcessFn = async (files, options, onProgress) => {
  const ratio = RATIOS[String(options.ratio ?? 'Free')];
  if (!ratio) throw new Error('Pick an aspect ratio — free-form crop with a drawn box is coming soon.');

  const type = outputTypeFor(files[0]);
  const blob = await transformImage(files[0], { cropRatio: ratio, type, quality: 0.92 });
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-cropped.${extensionFor(type)}`, blob }];
};
