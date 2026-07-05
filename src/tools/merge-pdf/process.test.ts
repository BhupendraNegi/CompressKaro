import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { process } from './process';

async function makePdfFile(name: string, pages: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([300, 400]);
  return new File([new Uint8Array(await doc.save())], name, { type: 'application/pdf' });
}

describe('merge-pdf process', () => {
  it('merges files in order into one PDF with all pages', async () => {
    const files = [await makePdfFile('a.pdf', 2), await makePdfFile('b.pdf', 3)];
    const progress: number[] = [];

    const outputs = await process(files, {}, (p) => progress.push(p));

    expect(outputs).toHaveLength(1);
    expect(outputs[0].name).toBe('merged.pdf');
    const merged = await PDFDocument.load(await outputs[0].blob.arrayBuffer());
    expect(merged.getPageCount()).toBe(5);
    expect(progress.at(-1)).toBe(100);
    expect(progress.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects corrupt input', async () => {
    const bad = new File([new TextEncoder().encode('not a pdf')], 'bad.pdf', { type: 'application/pdf' });
    await expect(process([bad], {}, () => {})).rejects.toThrow();
  });
});
