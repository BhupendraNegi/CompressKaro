/**
 * The tool registry data model (docs/Architecture.md §3, Rule 1).
 * Every tool is one ToolConfig + one ProcessFn; pages, homepage grid, footer,
 * search index, and sitemap all derive from the registry.
 */

export type ToolCategory = 'organize' | 'convert' | 'optimize' | 'annotate' | 'image';

export type ToolOption =
  | { type: 'slider'; key: string; label: string; min: number; max: number; step: number; def: number; unit?: string; hint?: string; labels?: string[] }
  | { type: 'number'; key: string; label: string; placeholder?: string; unit?: string; def?: number; hint?: string }
  | { type: 'text'; key: string; label: string; placeholder?: string; def?: string; hint?: string; inputType?: 'text' | 'password' }
  | { type: 'textarea'; key: string; label: string; placeholder?: string; def?: string; hint?: string; rows?: number }
  | { type: 'choice'; key: string; label: string; choices: string[]; def?: string; hint?: string };

export interface Faq {
  q: string;
  a: string;
}

export interface ToolConfig {
  /** URL slug, e.g. "merge-pdf" — the tool page is /<slug>/ */
  slug: string;
  name: string;
  /** One-line card/tool-page tagline */
  desc: string;
  /** <title> and meta description for SEO */
  metaTitle: string;
  metaDescription: string;
  category: ToolCategory;
  /** Icon key from the design's glyph set (docs/Design-System.md §8) */
  icon: string;
  /** File input accept attribute, e.g. ".pdf" or "image/*" */
  accept: string;
  multi: boolean;
  /** Max file count for multi tools (spec: merge caps at 25) */
  maxFiles?: number;
  /** Tool can run without any file (e.g. Create PDF's text editor) */
  optionalFile?: boolean;
  /** Verb for the Hinglish action button: "{verb} Karo →" */
  verb: string;
  options: ToolOption[];
  /** 3–4 step "How to use" section */
  steps: string[];
  /** 3–5 FAQs rendered with FAQPage JSON-LD */
  faqs: Faq[];
}

export type OptionValues = Record<string, string | number>;

export type ProgressFn = (percent: number) => void;

export interface ToolOutput {
  /** Suggested download filename (docs/Design-System.md §9) */
  name: string;
  blob: Blob;
}

/**
 * A tool's processing function. Pure (no React/DOM rendering), runs inside a
 * Web Worker, reports honest progress via onProgress. Returns one output per
 * downloadable file (usually one; multi-input image tools return several).
 */
export type ProcessFn = (
  files: File[],
  options: OptionValues,
  onProgress: ProgressFn,
) => Promise<ToolOutput[]>;
