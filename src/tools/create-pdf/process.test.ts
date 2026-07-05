import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { process } from './process';

describe('create-pdf process', () => {
  it('creates a PDF from typed content with the title as filename', async () => {
    const [out] = await process([], { content: 'Hello duniya!\nSecond line.', title: 'Greetings', size: 'Letter' }, () => {});
    expect(out.name).toBe('Greetings.pdf');
    const doc = await PDFDocument.load(await out.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
    expect(Math.round(doc.getPage(0).getWidth())).toBe(612);
  });

  it('prefers an uploaded text file over typed content', async () => {
    const file = new File(['from the file'], 'notes.txt', { type: 'text/plain' });
    const [out] = await process([file], { content: 'typed', title: '', size: 'A4' }, () => {});
    expect(out.name).toBe('document.pdf');
  });

  it('rejects empty input', async () => {
    await expect(process([], { content: '   ', title: 'x', size: 'A4' }, () => {})).rejects.toThrow(/Type some text/);
  });
});
