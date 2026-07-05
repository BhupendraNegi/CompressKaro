import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { process } from './process';

// Canonical 1×1 black JPEG.
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==',
  'base64',
);

const jpegFile = (name: string) => new File([new Uint8Array(TINY_JPEG)], name, { type: 'image/jpeg' });

describe('images-to-pdf process', () => {
  it('creates one A4 page per image', async () => {
    const [output] = await process([jpegFile('a.jpg'), jpegFile('b.jpg')], { size: 'A4', orient: 'Portrait' }, () => {});
    expect(output.name).toBe('images.pdf');
    const doc = await PDFDocument.load(await output.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(2);
    expect(Math.round(doc.getPage(0).getWidth())).toBe(595);
  });

  it('single image names output after the file', async () => {
    const [output] = await process([jpegFile('holiday.jpg')], { size: 'Letter', orient: 'Auto' }, () => {});
    expect(output.name).toBe('holiday.pdf');
  });
});
