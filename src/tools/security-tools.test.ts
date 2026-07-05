import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { process as protect } from './protect-pdf/process';
import { process as unlock } from './unlock-pdf/process';
import { process as metadata } from './pdf-metadata/process';
import { process as annotate } from './annotate-pdf/process';
import { buildIco } from '../lib/image/ico';

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function makePdfFile(pages = 2): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([400, 600]);
  return new File([new Uint8Array(await doc.save())], 'doc.pdf', { type: 'application/pdf' });
}

describe('protect-pdf → unlock-pdf round trip', () => {
  it('encrypts, refuses to open plainly, then unlocks with the password', async () => {
    const [locked] = await protect([await makePdfFile()], { pw: 'sherbet42', pw2: 'sherbet42' }, () => {});
    expect(locked.name).toBe('doc-protected.pdf');

    // Plain pdf-lib must reject the encrypted file without the password.
    const lockedBytes = await locked.blob.arrayBuffer();
    await expect(PDFDocument.load(lockedBytes)).rejects.toThrow();

    const lockedFile = new File([lockedBytes], 'doc-protected.pdf', { type: 'application/pdf' });
    const [unlocked] = await unlock([lockedFile], { pw: 'sherbet42' }, () => {});
    expect(unlocked.name).toBe('doc-protected-unlocked.pdf');
    const doc = await PDFDocument.load(await unlocked.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(2);
  });

  it('validates passwords', async () => {
    await expect(protect([await makePdfFile()], { pw: 'abc', pw2: 'abc' }, () => {})).rejects.toThrow(/at least 4/);
    await expect(protect([await makePdfFile()], { pw: 'abcd', pw2: 'xyz9' }, () => {})).rejects.toThrow(/match/);
  });

  it('rejects a wrong unlock password', async () => {
    const [locked] = await protect([await makePdfFile()], { pw: 'right-pw', pw2: 'right-pw' }, () => {});
    const lockedFile = new File([await locked.blob.arrayBuffer()], 'x.pdf', { type: 'application/pdf' });
    await expect(unlock([lockedFile], { pw: 'wrong-pw' }, () => {})).rejects.toThrow(/didn’t open/);
  });
});

describe('pdf-metadata', () => {
  it('sets the given fields and keeps page content', async () => {
    const [out] = await metadata([await makePdfFile(1)], { title: 'Annual Report', author: 'Priya', subject: '', keywords: 'finance, 2026' }, () => {});
    const doc = await PDFDocument.load(await out.blob.arrayBuffer());
    expect(doc.getTitle()).toBe('Annual Report');
    expect(doc.getAuthor()).toBe('Priya');
    expect(doc.getKeywords()).toContain('finance');
  });

  it('requires at least one field', async () => {
    await expect(metadata([await makePdfFile(1)], { title: '', author: '', subject: '', keywords: '' }, () => {})).rejects.toThrow(/at least one/);
  });
});

describe('annotate-pdf', () => {
  it('flattens ink onto the right pages', async () => {
    const inks = JSON.stringify({ '2': TINY_PNG_DATA_URL });
    const [out] = await annotate([await makePdfFile(3)], { inks }, () => {});
    expect(out.name).toBe('doc-annotated.pdf');
    expect((await PDFDocument.load(await out.blob.arrayBuffer())).getPageCount()).toBe(3);
  });

  it('requires at least one drawn page', async () => {
    await expect(annotate([await makePdfFile(1)], { inks: '{}' }, () => {})).rejects.toThrow(/Draw on at least one/);
  });
});

describe('buildIco', () => {
  it('writes a valid ICO directory over the PNG payloads', () => {
    const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
    const ico = buildIco([
      { size: 16, bytes: png },
      { size: 32, bytes: png },
    ]);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(2, true)).toBe(1); // icon type
    expect(view.getUint16(4, true)).toBe(2); // two entries
    expect(ico[6]).toBe(16); // first entry width
    expect(view.getUint32(18, true)).toBe(38); // first payload right after 6 + 2*16
    expect(ico.slice(38, 45)).toEqual(png);
  });
});
