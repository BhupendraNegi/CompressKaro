/** Page-range and page-order parsing for the PDF tools. All output is 0-based. */

/**
 * Parse "1-3, 5, 8-10" into ranges of 0-based page indices.
 * Empty input → every page as its own range (split-every-page mode).
 */
export function parseRanges(input: string, pageCount: number): number[][] {
  const trimmed = input.trim();
  if (!trimmed) return Array.from({ length: pageCount }, (_, i) => [i]);

  const ranges: number[][] = [];
  for (const part of trimmed.split(',')) {
    const piece = part.trim();
    if (!piece) continue;
    const m = piece.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid page range "${piece}" — use formats like "1-3" or "5".`);
    const start = Number(m[1]);
    const end = m[2] ? Number(m[2]) : start;
    if (start < 1 || end > pageCount || start > end) {
      throw new Error(`Page range "${piece}" is out of bounds — this PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}.`);
    }
    ranges.push(Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i));
  }
  if (!ranges.length) throw new Error('No valid page ranges given.');
  return ranges;
}

/**
 * Parse a full page order like "3, 1, 2" into 0-based indices. Forgiving:
 * blank → identity; pages you didn't mention are appended in original order;
 * duplicates and out-of-range pages are rejected.
 */
export function parseOrder(input: string, pageCount: number): number[] {
  const trimmed = input.trim();
  const identity = Array.from({ length: pageCount }, (_, i) => i);
  if (!trimmed) return identity;

  const seen = new Set<number>();
  const order: number[] = [];
  for (const piece of trimmed.split(',')) {
    const p = piece.trim();
    if (!p) continue;
    const n = Number(p);
    if (!Number.isInteger(n) || n < 1 || n > pageCount) {
      throw new Error(`"${p}" isn’t a valid page number — this PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}.`);
    }
    if (seen.has(n - 1)) throw new Error(`Page ${n} appears twice in the order.`);
    seen.add(n - 1);
    order.push(n - 1);
  }
  for (const i of identity) if (!seen.has(i)) order.push(i);
  return order;
}
