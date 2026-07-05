import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { process as rotate } from './rotate-pdf/process';
import { process as del } from './delete-pdf/process';
import { process as extract } from './extract-pdf/process';
import { process as crop } from './crop-pdf/process';
import { parsePages } from '../lib/pdf/ranges';

async function makePdfFile(pages: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([300 + i, 400]); // distinct widths mark pages
  return new File([new Uint8Array(await doc.save())], 'doc.pdf', { type: 'application/pdf' });
}

const load = async (blob: Blob) => PDFDocument.load(await blob.arrayBuffer());

describe('parsePages', () => {
  it('flattens, sorts and de-duplicates', () => {
    expect(parsePages('7-9, 2, 8', 10)).toEqual([1, 6, 7, 8]);
    expect(parsePages('', 5)).toEqual([]);
  });
});

describe('rotate-pdf', () => {
  it('rotates only selected pages', async () => {
    const [out] = await rotate([await makePdfFile(3)], { angle: '90° right', pages: '2' }, () => {});
    const doc = await load(out.blob);
    expect(doc.getPage(0).getRotation().angle).toBe(0);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
    expect(doc.getPage(2).getRotation().angle).toBe(0);
  });

  it('rotates all pages when selection is blank', async () => {
    const [out] = await rotate([await makePdfFile(2)], { angle: '180°', pages: '' }, () => {});
    const doc = await load(out.blob);
    expect(doc.getPage(0).getRotation().angle).toBe(180);
    expect(doc.getPage(1).getRotation().angle).toBe(180);
  });
});

describe('delete-pdf', () => {
  it('removes selected pages and keeps the rest in order', async () => {
    const [out] = await del([await makePdfFile(4)], { pages: '2, 4' }, () => {});
    const doc = await load(out.blob);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getWidth()).toBe(300); // page 1
    expect(doc.getPage(1).getWidth()).toBe(302); // page 3
  });

  it('refuses to delete every page', async () => {
    await expect(del([await makePdfFile(2)], { pages: '1-2' }, () => {})).rejects.toThrow(/at least one/);
  });

  it('requires a selection', async () => {
    await expect(del([await makePdfFile(2)], { pages: '' }, () => {})).rejects.toThrow(/Select the pages/);
  });
});

describe('extract-pdf', () => {
  it('copies only the selected pages', async () => {
    const [out] = await extract([await makePdfFile(5)], { pages: '1, 4-5' }, () => {});
    const doc = await load(out.blob);
    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getWidth()).toBe(300);
    expect(doc.getPage(1).getWidth()).toBe(303);
  });
});

describe('crop-pdf', () => {
  it('sets the crop box with the mm margin converted to points', async () => {
    const [out] = await crop([await makePdfFile(1)], { margin: 10, pages: '' }, () => {});
    const doc = await load(out.blob);
    const box = doc.getPage(0).getCropBox();
    const pt = (10 * 72) / 25.4;
    expect(box.x).toBeCloseTo(pt, 1);
    expect(box.width).toBeCloseTo(300 - pt * 2, 1);
  });

  it('rejects margins larger than the page', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]); // 100pt ≈ 35mm — a 50mm trim can't fit
    const tiny = new File([new Uint8Array(await doc.save())], 'tiny.pdf', { type: 'application/pdf' });
    await expect(crop([tiny], { margin: 50, pages: '' }, () => {})).rejects.toThrow(/larger than page/);
  });
});
