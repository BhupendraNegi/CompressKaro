import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { buildTextPdf, wrapText } from './textToPdf';

describe('wrapText', () => {
  it('wraps words at the width limit and keeps blank lines', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = wrapText('one two three four five\n\nsix', font, 12, 60);
    expect(lines.length).toBeGreaterThan(3);
    expect(lines).toContain('');
    for (const line of lines) expect(font.widthOfTextAtSize(line, 12)).toBeLessThanOrEqual(60);
  });

  it('hard-splits words longer than a line', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = wrapText('a'.repeat(200), font, 12, 100);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(font.widthOfTextAtSize(line, 12)).toBeLessThanOrEqual(100);
  });
});

describe('buildTextPdf', () => {
  it('paginates long text and sets the title', async () => {
    const out = await buildTextPdf(Array.from({ length: 120 }, (_, i) => `Line ${i + 1}`).join('\n'), 'My Notes', 'A4');
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(doc.getTitle()).toBe('My Notes');
    expect(Math.round(doc.getPage(0).getWidth())).toBe(595);
  });
});
