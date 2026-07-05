import type { ToolCategory, ToolConfig, ToolOption } from './types';

/**
 * The single source of truth for every tool (docs/Tool-Catalog.md).
 * Homepage grid, tool pages, footer columns, search, and sitemap all derive
 * from this list. Tools ship their full SEO bundle (steps + FAQs) in the phase
 * that implements them; until then the page renders a "coming soon" state.
 */

const slider = (key: string, label: string, min: number, max: number, def: number, unit = '', hint?: string, labels?: string[]): ToolOption =>
  ({ type: 'slider', key, label, min, max, step: 1, def, unit, hint, labels });
const num = (key: string, label: string, placeholder: string, unit: string, hint?: string): ToolOption =>
  ({ type: 'number', key, label, placeholder, unit, hint });
const txt = (key: string, label: string, placeholder: string, hint?: string, inputType: 'text' | 'password' = 'text'): ToolOption =>
  ({ type: 'text', key, label, placeholder, hint, inputType });
const choice = (key: string, label: string, choices: string[], hint?: string): ToolOption =>
  ({ type: 'choice', key, label, choices, def: choices[0], hint });

interface ToolSeed {
  slug: string;
  name: string;
  desc: string;
  category: ToolCategory;
  icon: string;
  verb: string;
  accept?: string;
  multi?: boolean;
  maxFiles?: number;
  options?: ToolOption[];
  metaTitle?: string;
  metaDescription?: string;
}

const tool = (seed: ToolSeed): ToolConfig => ({
  accept: '.pdf',
  multi: false,
  options: [],
  metaTitle: `${seed.name} Online — Free & 100% Private | CompressKaro`,
  metaDescription: `${seed.desc}. Free, no signup, and 100% private — the file is processed in your browser and never uploaded.`,
  steps: [],
  faqs: [],
  ...seed,
});

export const tools: ToolConfig[] = [
  // ── PDF · Organize ─────────────────────────────────────────────────────────
  {
    ...tool({ slug: 'merge-pdf', name: 'Merge PDF', desc: 'Combine up to 25 PDFs into one file', category: 'organize', icon: 'merge', verb: 'Merge', multi: true, maxFiles: 25 }),
    steps: [
      'Drop up to 25 PDF files into the box above, or tap to browse.',
      'Drag the files into the order you want — they merge top to bottom.',
      'Hit “Merge Karo” and watch it work, right on your device.',
      'Download your single, combined PDF. Done!',
    ],
    faqs: [
      { q: 'Is there a limit on how many PDFs I can merge?', a: 'You can merge up to 25 PDFs at once. There is no size limit beyond your device’s memory.' },
      { q: 'Are my PDFs uploaded to a server?', a: 'No. The merge happens entirely in your browser using JavaScript — your files never leave your device.' },
      { q: 'Will the merged PDF keep my formatting?', a: 'Yes. Pages are copied as-is, so fonts, images and layout stay exactly as they were in the originals.' },
      { q: 'Can I change the page order?', a: 'Yes — drag files up and down in the list (or use the arrow buttons) before merging. Files combine top to bottom.' },
    ],
  },
  tool({ slug: 'split-pdf', name: 'Split PDF', desc: 'Split by page ranges into separate files', category: 'organize', icon: 'split', verb: 'Split',
    options: [txt('ranges', 'Page ranges', 'e.g. 1-3, 5, 8-10', 'Each range becomes a separate PDF.')] }),
  tool({ slug: 'reorder-pdf', name: 'Reorder Pages', desc: 'Rearrange pages in any order', category: 'organize', icon: 'pages', verb: 'Reorder',
    options: [txt('order', 'New page order', 'e.g. 3, 1, 2, 4', 'Leave blank to reorder visually after upload.')] }),
  tool({ slug: 'extract-pdf', name: 'Extract Pages', desc: 'Pull selected pages into a new PDF', category: 'organize', icon: 'extract', verb: 'Extract',
    options: [txt('pages', 'Pages to extract', 'e.g. 1, 4-6')] }),
  tool({ slug: 'delete-pdf', name: 'Delete Pages', desc: 'Remove unwanted pages from a PDF', category: 'organize', icon: 'del', verb: 'Delete',
    options: [txt('pages', 'Pages to delete', 'e.g. 2, 7-9')] }),
  tool({ slug: 'rotate-pdf', name: 'Rotate PDF', desc: 'Rotate pages by 90°, 180° or 270°', category: 'organize', icon: 'rotate', verb: 'Rotate',
    options: [choice('angle', 'Rotation', ['90° right', '180°', '90° left']), choice('scope', 'Apply to', ['All pages', 'Selected pages'])] }),
  tool({ slug: 'crop-pdf', name: 'Crop PDF', desc: 'Trim margins on every page', category: 'organize', icon: 'crop', verb: 'Crop',
    options: [choice('scope', 'Apply to', ['All pages', 'Current page']), slider('margin', 'Trim margin', 0, 50, 10, ' mm')] }),

  // ── PDF · Convert & Create ─────────────────────────────────────────────────
  tool({ slug: 'images-to-pdf', name: 'Images to PDF', desc: 'Turn JPG, PNG or WebP into one PDF', category: 'convert', icon: 'img', verb: 'Convert', multi: true, accept: 'image/*',
    options: [choice('size', 'Page size', ['A4', 'Letter', 'Fit image']), choice('orient', 'Orientation', ['Auto', 'Portrait', 'Landscape'])] }),
  tool({ slug: 'pdf-to-images', name: 'PDF to Images', desc: 'Export every page as PNG or JPG', category: 'convert', icon: 'img', verb: 'Convert',
    options: [choice('fmt', 'Format', ['PNG', 'JPG']), slider('q', 'Quality', 10, 100, 90, '%')] }),
  tool({ slug: 'pdf-to-text', name: 'PDF to Text', desc: 'Extract all text from a PDF', category: 'convert', icon: 'text', verb: 'Extract',
    options: [choice('fmt', 'Output', ['Plain text', 'Markdown'])] }),
  tool({ slug: 'create-pdf', name: 'Create PDF', desc: 'Write text and save it as a PDF', category: 'convert', icon: 'create', verb: 'Create', accept: '.txt,.md',
    options: [txt('title', 'Document title', 'Untitled document'), choice('size', 'Page size', ['A4', 'Letter'])] }),

  // ── PDF · Optimize & Security ──────────────────────────────────────────────
  tool({ slug: 'compress-pdf', name: 'Compress PDF', desc: 'Shrink file size, keep the quality', category: 'optimize', icon: 'compress', verb: 'Compress',
    options: [slider('level', 'Compression level', 1, 3, 2, '', 'Higher = smaller file, softer images.', ['Light', 'Balanced', 'Strong']), num('target', 'Target size (optional)', 'e.g. 500', 'KB', 'We’ll get as close as possible.')] }),
  tool({ slug: 'protect-pdf', name: 'Protect PDF', desc: 'Add password encryption', category: 'optimize', icon: 'lock', verb: 'Protect',
    options: [txt('pw', 'Password', 'Choose a strong password', undefined, 'password'), txt('pw2', 'Confirm password', 'Type it again', undefined, 'password')] }),
  tool({ slug: 'unlock-pdf', name: 'Unlock PDF', desc: 'Remove a password you know', category: 'optimize', icon: 'unlock', verb: 'Unlock',
    options: [txt('pw', 'Current password', 'Enter the PDF password', 'Only works on PDFs whose password you have.', 'password')] }),
  tool({ slug: 'pdf-metadata', name: 'PDF Metadata Editor', desc: 'View & edit title, author, keywords', category: 'optimize', icon: 'doc', verb: 'Save',
    options: [txt('title', 'Title', 'Document title'), txt('author', 'Author', 'Author name'), txt('subject', 'Subject', 'Subject'), txt('keywords', 'Keywords', 'comma, separated, keywords')] }),

  // ── PDF · Annotate & Edit ──────────────────────────────────────────────────
  tool({ slug: 'sign-pdf', name: 'Sign PDF', desc: 'Draw and place your signature', category: 'annotate', icon: 'sign', verb: 'Sign',
    options: [choice('mode', 'Signature', ['Draw', 'Type']), txt('name', 'Your name', 'e.g. Priya Sharma', 'Click on the page preview to place it.')] }),
  tool({ slug: 'annotate-pdf', name: 'Annotate PDF', desc: 'Highlight, draw and add notes', category: 'annotate', icon: 'annotate', verb: 'Annotate',
    options: [choice('mode', 'Tool', ['Highlight', 'Note', 'Draw'])] }),
  tool({ slug: 'watermark-pdf', name: 'Watermark PDF', desc: 'Stamp text across every page', category: 'annotate', icon: 'watermark', verb: 'Watermark',
    options: [txt('wm', 'Watermark text', 'e.g. CONFIDENTIAL'), slider('op', 'Opacity', 5, 100, 25, '%'), choice('pos', 'Placement', ['Diagonal', 'Center', 'Bottom'])] }),
  tool({ slug: 'page-numbers-pdf', name: 'Add Page Numbers', desc: 'Number every page, your style', category: 'annotate', icon: 'hash', verb: 'Number',
    options: [choice('pos', 'Position', ['Bottom center', 'Bottom right', 'Top right']), choice('fmt', 'Format', ['1, 2, 3', 'Page 1 of N', '– 1 –'])] }),
  tool({ slug: 'header-footer-pdf', name: 'Header & Footer', desc: 'Add running text to every page', category: 'annotate', icon: 'hf', verb: 'Apply',
    options: [txt('h', 'Header text', 'e.g. Q2 Report — Draft'), txt('f', 'Footer text', 'e.g. © 2026 Acme Pvt Ltd')] }),

  // ── Image tools ────────────────────────────────────────────────────────────
  {
    ...tool({ slug: 'compress-image', name: 'Compress Image', desc: 'Shrink JPG, PNG or WebP files', category: 'image', icon: 'compress', verb: 'Compress', multi: true, accept: 'image/*',
      options: [slider('q', 'Quality', 10, 100, 75, '%', 'Lower quality = smaller file.'), num('target', 'Target size (optional)', 'e.g. 200', 'KB', 'We’ll compress until the file is at or under this size.')] }),
    steps: [
      'Drop one or more JPG, PNG or WebP images into the box above.',
      'Pick a quality level — or set a target size in KB and we’ll hit it.',
      'Hit “Compress Karo”. The work happens on your device, never on a server.',
      'Download your smaller images. Ho gaya!',
    ],
    faqs: [
      { q: 'How does the target size mode work?', a: 'We repeatedly re-encode the image at different quality levels (and, if needed, smaller dimensions) until it fits at or under your target KB — all locally in your browser.' },
      { q: 'Are my photos uploaded anywhere?', a: 'Never. Compression runs 100% in your browser. Your photos stay on your device.' },
      { q: 'What format is the output?', a: 'Compressed images are saved as JPG — the most compatible format for small file sizes. Transparent areas are flattened onto white.' },
      { q: 'Can I compress many images at once?', a: 'Yes — drop in multiple images and each one is compressed with the same settings.' },
    ],
  },
  tool({ slug: 'resize-image', name: 'Resize Image', desc: 'Scale to exact pixel dimensions', category: 'image', icon: 'resize', verb: 'Resize', accept: 'image/*',
    options: [num('w', 'Width', 'e.g. 1200', 'px'), num('h', 'Height', 'auto', 'px', 'Leave blank to keep aspect ratio.')] }),
  tool({ slug: 'convert-image', name: 'Convert Image', desc: 'Switch between JPG, PNG and WebP', category: 'image', icon: 'convert', verb: 'Convert', multi: true, accept: 'image/*',
    options: [choice('fmt', 'Convert to', ['JPG', 'PNG', 'WebP'])] }),
  tool({ slug: 'convert-webp', name: 'Convert to WebP', desc: 'Modern format, much smaller files', category: 'image', icon: 'convert', verb: 'Convert', multi: true, accept: 'image/*',
    options: [slider('q', 'Quality', 10, 100, 80, '%')] }),
  tool({ slug: 'crop-image', name: 'Crop Image', desc: 'Crop free-form or to a ratio', category: 'image', icon: 'crop', verb: 'Crop', accept: 'image/*',
    options: [choice('ratio', 'Aspect ratio', ['Free', '1:1', '4:3', '16:9', 'Passport'])] }),
  tool({ slug: 'rotate-flip-image', name: 'Rotate & Flip', desc: 'Rotate or mirror any image', category: 'image', icon: 'flip', verb: 'Apply', accept: 'image/*',
    options: [choice('rot', 'Rotate', ['None', '90° right', '180°', '90° left']), choice('flip', 'Flip', ['None', 'Horizontal', 'Vertical'])] }),
  tool({ slug: 'strip-exif', name: 'Strip EXIF Data', desc: 'Remove metadata & location info', category: 'image', icon: 'exif', verb: 'Clean', multi: true, accept: 'image/*' }),
  tool({ slug: 'watermark-image', name: 'Image Watermark', desc: 'Stamp text or a logo on photos', category: 'image', icon: 'watermark', verb: 'Watermark', multi: true, accept: 'image/*',
    options: [txt('wm', 'Watermark text', 'e.g. © Your Name'), slider('op', 'Opacity', 5, 100, 40, '%'), choice('pos', 'Position', ['Bottom right', 'Center', 'Tile'])] }),
  tool({ slug: 'favicon-generator', name: 'Favicon Generator', desc: 'One image → every favicon size', category: 'image', icon: 'img', verb: 'Generate', accept: 'image/*' }),
  tool({ slug: 'bulk-image', name: 'Bulk Compress & Resize', desc: 'Process many images at once', category: 'image', icon: 'img', verb: 'Process', multi: true, accept: 'image/*',
    options: [slider('q', 'Quality', 10, 100, 75, '%'), num('maxw', 'Max width (optional)', 'e.g. 1920', 'px'), choice('fmt', 'Format', ['Keep original', 'JPG', 'WebP'])] }),
];

/** Slugs of tools whose processing is implemented; others render "coming soon".
 *  Keep in sync with the processor map in src/lib/workers/worker.ts. */
export const liveTools = new Set<string>(['merge-pdf', 'compress-image']);

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);

// ── Homepage grid structure (docs/Design-System.md §5) ───────────────────────

const categoryLabels: Record<ToolCategory, string> = {
  organize: 'Organize',
  convert: 'Convert',
  optimize: 'Optimize & Security',
  annotate: 'Annotate & Edit',
  image: 'All image tools',
};

const byCategory = (cat: ToolCategory) => tools.filter((t) => t.category === cat);

export const homeSections = [
  {
    title: 'PDF Tools',
    sub: 'Merge, split, compress, sign — sab kuch, right in your browser.',
    groups: (['organize', 'convert', 'optimize', 'annotate'] as ToolCategory[]).map((c) => ({
      label: categoryLabels[c],
      tools: byCategory(c),
    })),
  },
  {
    title: 'Image Tools',
    sub: 'Compress, resize and convert images without uploading them anywhere.',
    groups: [{ label: categoryLabels.image, tools: byCategory('image') }],
  },
];

// ── Footer columns (docs/Tool-Catalog.md reconciliation notes) ───────────────

const bySlugs = (slugs: string[]) => slugs.map((s) => toolBySlug(s)!);

export const footerColumns = [
  { title: 'Organize', tools: bySlugs(['merge-pdf', 'split-pdf', 'reorder-pdf', 'extract-pdf', 'delete-pdf', 'rotate-pdf', 'crop-pdf']) },
  { title: 'Convert', tools: bySlugs(['images-to-pdf', 'pdf-to-images', 'pdf-to-text', 'create-pdf']) },
  { title: 'Edit & Annotate', tools: bySlugs(['sign-pdf', 'annotate-pdf', 'watermark-pdf', 'page-numbers-pdf', 'header-footer-pdf']) },
  { title: 'Optimize & Security', tools: bySlugs(['compress-pdf', 'protect-pdf', 'unlock-pdf', 'pdf-metadata']) },
  { title: 'Image Tools', tools: bySlugs(['compress-image', 'resize-image', 'convert-webp', 'convert-image', 'crop-image', 'rotate-flip-image', 'strip-exif', 'watermark-image', 'favicon-generator', 'bulk-image']) },
];
