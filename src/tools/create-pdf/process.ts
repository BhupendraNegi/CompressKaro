import { buildTextPdf } from '../../lib/pdf/textToPdf';
import type { ProcessFn } from '../types';

/** Turn typed text (or an uploaded .txt/.md) into a formatted PDF. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const typed = String(options.content ?? '');
  const text = files.length ? await files[0].text() : typed;
  if (!text.trim()) throw new Error('Type some text (or add a .txt/.md file) to create your PDF.');
  onProgress(30);

  const title = String(options.title ?? '').trim() || 'document';
  const out = await buildTextPdf(text, title, String(options.size ?? 'A4'));
  onProgress(100);
  return [{ name: `${title}.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
