import { PDFDocument } from '@cantoo/pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Decrypt with the known password and save an unencrypted copy. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const pw = String(options.pw ?? '');
  if (!pw) throw new Error('Enter the PDF’s current password.');

  let doc;
  try {
    doc = await PDFDocument.load(await files[0].arrayBuffer(), { password: pw });
  } catch {
    throw new Error('That password didn’t open this PDF. Check it and try again.');
  }
  onProgress(60);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-unlocked.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
