import { extensionFor, outputTypeFor, transformImage } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

const ROTATIONS: Record<string, 0 | 90 | 180 | 270> = {
  None: 0,
  '90° right': 90,
  '180°': 180,
  '90° left': 270,
};

/** Rotate and/or mirror an image. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const rotate = ROTATIONS[String(options.rot ?? 'None')] ?? 0;
  const flip = String(options.flip ?? 'None');
  if (!rotate && flip === 'None') throw new Error('Pick a rotation or a flip — right now nothing would change.');

  const type = outputTypeFor(files[0]);
  const blob = await transformImage(files[0], {
    rotate,
    flipH: flip === 'Horizontal',
    flipV: flip === 'Vertical',
    type,
    quality: 0.92,
  });
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-rotated.${extensionFor(type)}`, blob }];
};
