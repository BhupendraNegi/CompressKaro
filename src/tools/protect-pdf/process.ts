// @cantoo/pdf-lib is the pdf-lib fork with encryption support; used only by
// the protect/unlock tools, so it code-splits away from everything else.
import { PDFDocument } from '@cantoo/pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Encrypt the PDF with a password (AES). */
export const process: ProcessFn = async (files, options, onProgress) => {
  const pw = String(options.pw ?? '');
  const pw2 = String(options.pw2 ?? '');
  if (pw.length < 4) throw new Error('Choose a password of at least 4 characters.');
  if (pw !== pw2) throw new Error('The passwords don’t match — type the same one twice.');

  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  onProgress(40);
  doc.encrypt({ userPassword: pw, ownerPassword: pw });
  const out = await doc.save({ useObjectStreams: false });
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-protected.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
