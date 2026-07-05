import { describe, expect, it } from 'vitest';
import { parseOrder, parseRanges } from './ranges';

describe('parseRanges', () => {
  it('parses mixed ranges and single pages (0-based)', () => {
    expect(parseRanges('1-3, 5, 8-10', 10)).toEqual([[0, 1, 2], [4], [7, 8, 9]]);
  });

  it('blank input splits every page', () => {
    expect(parseRanges('', 3)).toEqual([[0], [1], [2]]);
  });

  it('rejects out-of-bounds and malformed input', () => {
    expect(() => parseRanges('1-99', 5)).toThrow(/out of bounds/);
    expect(() => parseRanges('3-1', 5)).toThrow(/out of bounds/);
    expect(() => parseRanges('abc', 5)).toThrow(/Invalid page range/);
  });
});

describe('parseOrder', () => {
  it('parses a full explicit order', () => {
    expect(parseOrder('3, 1, 2', 3)).toEqual([2, 0, 1]);
  });

  it('appends unmentioned pages in original order', () => {
    expect(parseOrder('4, 2', 5)).toEqual([3, 1, 0, 2, 4]);
  });

  it('blank input is the identity order', () => {
    expect(parseOrder('', 4)).toEqual([0, 1, 2, 3]);
  });

  it('rejects duplicates and out-of-range pages', () => {
    expect(() => parseOrder('1, 1', 3)).toThrow(/twice/);
    expect(() => parseOrder('9', 3)).toThrow(/valid page number/);
  });
});
