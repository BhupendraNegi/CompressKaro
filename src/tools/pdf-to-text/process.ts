import { extractText } from '../../lib/pdf/render';
import { baseName } from '../../lib/files';
import type { ProcessFn } from '../types';

/** Extract all text, as plain text or Markdown with page headings. */
export const process: ProcessFn = async (files, options, onProgress) => {
  const markdown = String(options.fmt ?? 'Plain text') === 'Markdown';
  const base = baseName(files[0].name);
  const pages = await extractText(await files[0].arrayBuffer(), (p) => onProgress(Math.round(p * 0.95)));

  const text = markdown
    ? `# ${base}\n\n${pages.map((t, i) => `## Page ${i + 1}\n\n${t || '_(no text on this page)_'}`).join('\n\n')}\n`
    : pages.join('\n\n');

  onProgress(100);
  return [{ name: `${base}.${markdown ? 'md' : 'txt'}`, blob: new Blob([text], { type: 'text/plain;charset=utf-8' }) }];
};
