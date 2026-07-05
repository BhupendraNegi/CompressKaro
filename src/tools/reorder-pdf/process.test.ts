import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { process } from './process';

describe('reorder-pdf process', () => {
  it('reorders pages by the given order', async () => {
    const doc = await PDFDocument.create();
    // Distinct page sizes let us verify order in the output.
    doc.addPage([100, 100]);
    doc.addPage([200, 200]);
    doc.addPage([300, 300]);
    const file = new File([new Uint8Array(await doc.save())], 'in.pdf', { type: 'application/pdf' });

    const [output] = await process([file], { order: '3, 1, 2' }, () => {});
    expect(output.name).toBe('in-reordered.pdf');

    const out = await PDFDocument.load(await output.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(3);
    expect(out.getPage(0).getWidth()).toBe(300);
    expect(out.getPage(1).getWidth()).toBe(100);
    expect(out.getPage(2).getWidth()).toBe(200);
  });
});
