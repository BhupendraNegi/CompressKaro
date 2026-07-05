import { compressImage } from '../../lib/image/compress';
import { baseName } from '../../lib/files';
import type { ProcessFn, ToolOutput } from '../types';

/** Compress each image; quality slider or iterative target-KB mode. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const quality = Number(options.q ?? 75);
  const target = Number(options.target);
  const targetKb = Number.isFinite(target) && target > 0 ? target : undefined;

  const outputs: ToolOutput[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await compressImage(files[i], { quality, targetKb }, (p) =>
      onProgress(Math.round(((i + p / 100) / files.length) * 100)),
    );
    outputs.push({ name: `${baseName(files[i].name)}-compressed.jpg`, blob });
  }
  onProgress(100);
  return outputs;
};
