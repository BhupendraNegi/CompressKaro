import { extensionFor, outputTypeFor, transformImage, type ImageType } from '../../lib/image/transform';
import { baseName } from '../../lib/files';
import { zipBlob } from '../../lib/zip';
import type { ProcessFn } from '../types';

const FORMATS: Record<string, ImageType | undefined> = {
  'Keep original': undefined,
  JPG: 'image/jpeg',
  WebP: 'image/webp',
};

/** Compress + optionally cap width + convert many images at once; zip output. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const quality = Number(options.q ?? 75) / 100;
  const maxWidth = Number(options.maxw) || 0;
  const forced = FORMATS[String(options.fmt ?? 'Keep original')];

  const entries: Record<string, Uint8Array> = {};
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const type = forced ?? outputTypeFor(file);
    const blob = await transformImage(file, { maxWidth: maxWidth || undefined, type, quality });
    entries[`${baseName(file.name)}.${extensionFor(type)}`] = new Uint8Array(await blob.arrayBuffer());
    onProgress(Math.round(((i + 1) / (files.length + 1)) * 100));
  }

  const blob = zipBlob(entries);
  onProgress(100);
  return [{ name: `${files.length}-images.zip`, blob }];
};
