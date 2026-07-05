import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { process as sign } from './sign-pdf/process';
import { process as watermark } from './watermark-pdf/process';
import { process as pageNumbers } from './page-numbers-pdf/process';
import { process as headerFooter } from './header-footer-pdf/process';

// 1×1 red PNG.
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function makePdfFile(pages: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([400, 600]);
  return new File([new Uint8Array(await doc.save())], 'doc.pdf', { type: 'application/pdf' });
}

const load = async (blob: Blob) => PDFDocument.load(await blob.arrayBuffer());

describe('sign-pdf', () => {
  it('stamps the signature and keeps the page count', async () => {
    const placement = JSON.stringify({ page: 2, x: 0.5, y: 0.8, w: 0.3 });
    const [out] = await sign([await makePdfFile(2)], { sig: TINY_PNG_DATA_URL, placement }, () => {});
    expect(out.name).toBe('doc-signed.pdf');
    const doc = await load(out.blob);
    expect(doc.getPageCount()).toBe(2);
    // The signed output must be larger — the PNG is embedded.
    expect(out.blob.size).toBeGreaterThan((await makePdfFile(2)).size);
  });

  it('requires a signature and a placement', async () => {
    await expect(sign([await makePdfFile(1)], { sig: '', placement: '' }, () => {})).rejects.toThrow(/signature/);
    await expect(sign([await makePdfFile(1)], { sig: TINY_PNG_DATA_URL, placement: '' }, () => {})).rejects.toThrow(/Click the page/);
  });
});

describe('watermark-pdf', () => {
  it('stamps every page and requires text', async () => {
    const [out] = await watermark([await makePdfFile(3)], { wm: 'CONFIDENTIAL', op: 25, pos: 'Diagonal' }, () => {});
    const doc = await load(out.blob);
    expect(doc.getPageCount()).toBe(3);
    await expect(watermark([await makePdfFile(1)], { wm: ' ', op: 25, pos: 'Center' }, () => {})).rejects.toThrow(/watermark text/);
  });
});

describe('page-numbers-pdf', () => {
  it('numbers all pages in each format', async () => {
    for (const fmt of ['1, 2, 3', 'Page 1 of N', '– 1 –']) {
      const [out] = await pageNumbers([await makePdfFile(2)], { pos: 'Bottom center', fmt }, () => {});
      expect((await load(out.blob)).getPageCount()).toBe(2);
    }
  });
});

describe('header-footer-pdf', () => {
  it('applies header/footer text and rejects empty input', async () => {
    const [out] = await headerFooter([await makePdfFile(2)], { h: 'Q2 Report', f: '© 2026' }, () => {});
    expect(out.name).toBe('doc-hf.pdf');
    expect((await load(out.blob)).getPageCount()).toBe(2);
    await expect(headerFooter([await makePdfFile(1)], { h: '', f: '' }, () => {})).rejects.toThrow(/header/);
  });
});
