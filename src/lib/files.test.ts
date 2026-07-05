import { describe, expect, it } from 'vitest';
import { baseName, formatSize } from './files';

describe('formatSize', () => {
  it('formats megabytes to one decimal', () => {
    expect(formatSize(2480000)).toBe('2.4 MB');
    expect(formatSize(1048576)).toBe('1.0 MB');
  });

  it('formats kilobytes, rounding to whole numbers', () => {
    expect(formatSize(612000)).toBe('598 KB');
  });

  it('never shows 0 KB for tiny files', () => {
    expect(formatSize(1)).toBe('1 KB');
  });
});

describe('matchesAccept', () => {
  const file = (name: string, type: string) => new File([], name, { type });
  it('matches extension lists, mime wildcards and exact types', async () => {
    const { matchesAccept } = await import('./files');
    expect(matchesAccept(file('a.PDF', 'application/pdf'), '.pdf')).toBe(true);
    expect(matchesAccept(file('a.docx', 'application/vnd.x'), '.pdf')).toBe(false);
    expect(matchesAccept(file('p.webp', 'image/webp'), 'image/*')).toBe(true);
    expect(matchesAccept(file('p.mp4', 'video/mp4'), 'image/*')).toBe(false);
    expect(matchesAccept(file('n.md', 'text/markdown'), '.txt,.md')).toBe(true);
  });
});

describe('baseName', () => {
  it('strips only the final extension', () => {
    expect(baseName('report.pdf')).toBe('report');
    expect(baseName('archive.v2.final.pdf')).toBe('archive.v2.final');
    expect(baseName('no-extension')).toBe('no-extension');
  });
});
