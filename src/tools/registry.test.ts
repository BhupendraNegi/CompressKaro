import { describe, expect, it } from 'vitest';
import { footerColumns, homeSections, tools } from './registry';

describe('tool registry', () => {
  it('has 30 tools with unique slugs', () => {
    expect(tools).toHaveLength(30);
    expect(new Set(tools.map((t) => t.slug)).size).toBe(tools.length);
  });

  it('lists every tool exactly once on the homepage', () => {
    const gridSlugs = homeSections.flatMap((s) => s.groups.flatMap((g) => g.tools.map((t) => t.slug)));
    expect(gridSlugs.sort()).toEqual(tools.map((t) => t.slug).sort());
  });

  it('lists every tool exactly once in the footer', () => {
    const footerSlugs = footerColumns.flatMap((c) => c.tools.map((t) => t.slug));
    expect(footerSlugs.sort()).toEqual(tools.map((t) => t.slug).sort());
  });

  it('gives every tool SEO meta and an action verb', () => {
    for (const t of tools) {
      expect(t.metaTitle).toContain(t.name);
      expect(t.metaDescription.length).toBeGreaterThan(50);
      expect(t.verb.length).toBeGreaterThan(0);
    }
  });

  it('caps merge-pdf at 25 files', () => {
    expect(tools.find((t) => t.slug === 'merge-pdf')?.maxFiles).toBe(25);
  });
});
