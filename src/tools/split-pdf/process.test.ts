import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { unzipSync } from 'fflate';
import { process } from './process';

async function makePdfFile(name: string, pages: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([300, 400]);
  return new File([new Uint8Array(await doc.save())], name, { type: 'application/pdf' });
}

describe('split-pdf process', () => {
  it('splits ranges into a zip of PDFs with correct page counts', async () => {
    const file = await makePdfFile('report.pdf', 5);
    const [output] = await process([file], { ranges: '1-2, 4' }, () => {});

    expect(output.name).toBe('report-split.zip');
    const entries = unzipSync(new Uint8Array(await output.blob.arrayBuffer()));
    const names = Object.keys(entries).sort();
    expect(names).toEqual(['report-page-4.pdf', 'report-pages-1-2.pdf']);

    const twoPages = await PDFDocument.load(entries['report-pages-1-2.pdf']);
    expect(twoPages.getPageCount()).toBe(2);
    const onePage = await PDFDocument.load(entries['report-page-4.pdf']);
    expect(onePage.getPageCount()).toBe(1);
  });

  it('blank ranges exports every page separately', async () => {
    const file = await makePdfFile('doc.pdf', 3);
    const [output] = await process([file], { ranges: '' }, () => {});
    const entries = unzipSync(new Uint8Array(await output.blob.arrayBuffer()));
    expect(Object.keys(entries)).toHaveLength(3);
  });
});
