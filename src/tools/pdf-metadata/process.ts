import { PDFDocument } from 'pdf-lib';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Update title/author/subject/keywords; blank fields keep existing values. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const doc = await PDFDocument.load(await files[0].arrayBuffer());
  onProgress(40);

  const title = String(options.title ?? '').trim();
  const author = String(options.author ?? '').trim();
  const subject = String(options.subject ?? '').trim();
  const keywords = String(options.keywords ?? '').trim();
  if (!title && !author && !subject && !keywords) {
    throw new Error('Fill in at least one field — blank fields keep their current value.');
  }

  if (title) doc.setTitle(title);
  if (author) doc.setAuthor(author);
  if (subject) doc.setSubject(subject);
  if (keywords) doc.setKeywords(keywords.split(',').map((k) => k.trim()).filter(Boolean));
  onProgress(70);

  const out = await doc.save();
  onProgress(100);
  return [{ name: `${baseName(files[0].name)}-metadata.pdf`, blob: new Blob([new Uint8Array(out)], { type: 'application/pdf' }) }];
};
