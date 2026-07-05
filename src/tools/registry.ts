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
  {
    ...tool({ slug: 'split-pdf', name: 'Split PDF', desc: 'Split by page ranges into separate files', category: 'organize', icon: 'split', verb: 'Split',
      options: [txt('ranges', 'Page ranges', 'e.g. 1-3, 5, 8-10', 'Each range becomes a separate PDF. Leave blank to export every page separately.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Type the page ranges you want, like “1-3, 5, 8-10” — or leave blank to split every page.',
      'Hit “Split Karo”. Everything happens on your device.',
      'Download a zip with one PDF per range.',
    ],
    faqs: [
      { q: 'How do I write page ranges?', a: 'Comma-separated: “1-3, 5, 8-10” makes three PDFs — pages 1 to 3, page 5, and pages 8 to 10. Leave the field blank to export every page as its own PDF.' },
      { q: 'What do I get as output?', a: 'A single zip file containing one PDF per range, named after the original file and the pages inside.' },
      { q: 'Is my PDF uploaded while splitting?', a: 'No — the split and even the zip are created entirely in your browser. Nothing leaves your device.' },
    ],
  },
  {
    ...tool({ slug: 'reorder-pdf', name: 'Reorder Pages', desc: 'Rearrange pages in any order', category: 'organize', icon: 'pages', verb: 'Reorder',
      options: [txt('order', 'New page order', 'e.g. 3, 1, 2, 4', 'Drag the page thumbnails above, or type the order here.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Drag the page thumbnails into the order you want (or type it, like “3, 1, 2”).',
      'Hit “Reorder Karo” — pages you don’t mention keep their original order.',
      'Download the rearranged PDF.',
    ],
    faqs: [
      { q: 'Do I have to list every page?', a: 'No. Pages you don’t mention are appended after the ones you do, keeping their original order.' },
      { q: 'Can I see the pages before reordering?', a: 'Yes — page thumbnails render right in the tool and you drag them into the new order.' },
      { q: 'Does reordering change the page content?', a: 'No, pages are copied exactly as they are — only their order changes.' },
    ],
  },
  {
    ...tool({ slug: 'extract-pdf', name: 'Extract Pages', desc: 'Pull selected pages into a new PDF', category: 'organize', icon: 'extract', verb: 'Extract',
      options: [txt('pages', 'Pages to extract', 'e.g. 1, 4-6', 'Click the thumbnails above, or type page numbers and ranges.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Click the page thumbnails you want (or type them, like “1, 4-6”).',
      'Hit “Extract Karo”.',
      'Download a new PDF containing just those pages.',
    ],
    faqs: [
      { q: 'Does extracting change my original PDF?', a: 'No — your original file is untouched. You get a brand-new PDF with copies of the pages you picked.' },
      { q: 'Can I extract pages in a different order?', a: 'Extracted pages keep their original order. To change the order, run the result through the Reorder Pages tool.' },
      { q: 'Is my document uploaded?', a: 'No — extraction happens entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'delete-pdf', name: 'Delete Pages', desc: 'Remove unwanted pages from a PDF', category: 'organize', icon: 'del', verb: 'Delete',
      options: [txt('pages', 'Pages to delete', 'e.g. 2, 7-9', 'Click the thumbnails above, or type page numbers and ranges.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Click the thumbnails of the pages you want gone (or type them, like “2, 7-9”).',
      'Hit “Delete Karo”.',
      'Download the PDF without those pages.',
    ],
    faqs: [
      { q: 'Can I undo a deletion?', a: 'Your original file is never modified, so just start over from it if you deleted the wrong pages.' },
      { q: 'Can I delete every page?', a: 'No — at least one page must remain, and the tool will tell you if you try.' },
      { q: 'Is the file uploaded to delete pages?', a: 'No — everything happens locally in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'rotate-pdf', name: 'Rotate PDF', desc: 'Rotate pages by 90°, 180° or 270°', category: 'organize', icon: 'rotate', verb: 'Rotate',
      options: [choice('angle', 'Rotation', ['90° right', '180°', '90° left']), txt('pages', 'Pages (optional)', 'blank = all pages', 'Click thumbnails to rotate only specific pages.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Pick the rotation: 90° right, 180°, or 90° left.',
      'Leave the pages field blank to rotate everything, or click thumbnails for specific pages.',
      'Hit “Rotate Karo” and download.',
    ],
    faqs: [
      { q: 'Can I rotate just one page?', a: 'Yes — click that page’s thumbnail (or type its number) and only it will rotate.' },
      { q: 'Does rotating reduce quality?', a: 'No. Rotation only changes the page’s display orientation — the content is untouched.' },
      { q: 'Is my PDF uploaded to rotate it?', a: 'No — rotation happens entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'crop-pdf', name: 'Crop PDF', desc: 'Trim margins on every page', category: 'organize', icon: 'crop', verb: 'Crop',
      options: [slider('margin', 'Trim margin', 0, 50, 10, ' mm', 'An even trim off all four edges.'), txt('pages', 'Pages (optional)', 'blank = all pages', 'Click thumbnails to crop only specific pages.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Set how many millimetres to trim off every edge.',
      'Leave pages blank to crop all of them, or pick specific pages.',
      'Hit “Crop Karo” and download.',
    ],
    faqs: [
      { q: 'Is cropping destructive?', a: 'No — we set the page’s crop box, which tells viewers what to display. The full content is still in the file, and the trim can be undone by resetting the crop box.' },
      { q: 'Can I crop different amounts per edge?', a: 'Not yet — this tool trims an even margin from all four edges. A draw-your-own crop box is on the roadmap.' },
      { q: 'Is my PDF uploaded to crop it?', a: 'No — cropping happens entirely in your browser.' },
    ],
  },

  // ── PDF · Convert & Create ─────────────────────────────────────────────────
  {
    ...tool({ slug: 'images-to-pdf', name: 'Images to PDF', desc: 'Turn JPG, PNG or WebP into one PDF', category: 'convert', icon: 'img', verb: 'Convert', multi: true, accept: 'image/*',
      options: [choice('size', 'Page size', ['A4', 'Letter', 'Fit image']), choice('orient', 'Orientation', ['Auto', 'Portrait', 'Landscape'])] }),
    steps: [
      'Drop your images (JPG, PNG or WebP) into the box above.',
      'Drag them into the page order you want.',
      'Pick a page size — A4, Letter, or pages fitted to each image.',
      'Hit “Convert Karo” and download one combined PDF.',
    ],
    faqs: [
      { q: 'How many images can I combine?', a: 'Up to 25 images become one PDF, one image per page, in the order you arrange them.' },
      { q: 'What does “Fit image” do?', a: 'Each PDF page takes the exact dimensions of its image — no margins, no whitespace.' },
      { q: 'Are WebP images supported?', a: 'Yes. WebP images are converted on your device before being placed into the PDF.' },
      { q: 'Do my photos get uploaded?', a: 'Never — the PDF is assembled entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'pdf-to-images', name: 'PDF to Images', desc: 'Export every page as PNG or JPG', category: 'convert', icon: 'img', verb: 'Convert',
      options: [choice('fmt', 'Format', ['PNG', 'JPG']), slider('q', 'Quality', 10, 100, 90, '%', 'Quality applies to JPG output.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Pick PNG (sharp, larger) or JPG (smaller) and a quality level.',
      'Hit “Convert Karo” — every page is rendered on your device.',
      'Download one image, or a zip when there are multiple pages.',
    ],
    faqs: [
      { q: 'What resolution are the images?', a: 'Pages render at 2× their PDF size — crisp enough for screens and most documents.' },
      { q: 'PNG or JPG — which should I pick?', a: 'PNG for text-heavy pages and diagrams (lossless), JPG for photo-heavy pages (much smaller files).' },
      { q: 'Is my PDF uploaded to convert it?', a: 'No — rendering happens entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'pdf-to-text', name: 'PDF to Text', desc: 'Extract all text from a PDF', category: 'convert', icon: 'text', verb: 'Extract',
      options: [choice('fmt', 'Output', ['Plain text', 'Markdown'])] }),
    steps: [
      'Drop your PDF into the box above.',
      'Choose plain text, or Markdown with a heading per page.',
      'Hit “Extract Karo”.',
      'Download the text file.',
    ],
    faqs: [
      { q: 'Does this work on scanned PDFs?', a: 'No — scanned pages are images with no text layer, and this tool doesn’t do OCR (yet). It extracts the real text a PDF contains.' },
      { q: 'Will the layout be preserved?', a: 'Text comes out in reading order per page, but columns and tables flatten into plain text.' },
      { q: 'Is my document uploaded?', a: 'No — extraction happens entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'create-pdf', name: 'Create PDF', desc: 'Write text and save it as a PDF', category: 'convert', icon: 'create', verb: 'Create', accept: '.txt,.md',
      options: [
        { type: 'textarea', key: 'content', label: 'Your text', placeholder: 'Type or paste your text here…', rows: 12 },
        txt('title', 'Document title', 'Untitled document'),
        choice('size', 'Page size', ['A4', 'Letter']),
      ] }),
    optionalFile: true,
    steps: [
      'Type or paste your text — or drop in a .txt / .md file.',
      'Give the document a title and pick a page size.',
      'Hit “Create Karo”.',
      'Download a clean, paginated PDF.',
    ],
    faqs: [
      { q: 'Do I need to upload a file?', a: 'No — just start typing. You can also drop in an existing .txt or .md file to convert it.' },
      { q: 'How is the text formatted?', a: 'Clean Helvetica at 12pt with generous margins, word-wrapped and split into pages automatically.' },
      { q: 'Is my text sent anywhere?', a: 'No — the PDF is generated entirely in your browser.' },
    ],
  },

  // ── PDF · Optimize & Security ──────────────────────────────────────────────
  {
    ...tool({ slug: 'compress-pdf', name: 'Compress PDF', desc: 'Shrink file size, keep the quality', category: 'optimize', icon: 'compress', verb: 'Compress',
      options: [slider('level', 'Compression level', 1, 3, 2, '', 'Higher = smaller file, softer images.', ['Light', 'Balanced', 'Strong']), num('target', 'Target size (optional)', 'e.g. 500', 'KB', 'We’ll get as close as possible.')] }),
    steps: [
      'Drop your PDF into the box above.',
      'Choose a level: Light, Balanced or Strong — or set a target size in KB.',
      'Hit “Compress Karo”. Pages are re-rendered at reduced quality on your device.',
      'Compare the before/after size and download.',
    ],
    faqs: [
      { q: 'How does the compression work?', a: 'Every page is re-rendered as an optimized image at reduced quality and resolution — the same trick print-to-PDF uses. Text-heavy PDFs stay readable; image-heavy PDFs shrink the most.' },
      { q: 'Will my text still be selectable?', a: 'No — compressed pages become images, so text can no longer be selected or searched. That trade-off is what makes the big size cuts possible.' },
      { q: 'What if the result is larger than my target?', a: 'We retry at lower quality and resolution up to three times and keep the smallest result. Some PDFs simply can’t go lower without becoming unreadable.' },
      { q: 'Is my PDF uploaded to compress it?', a: 'No. Rendering and rebuilding happen 100% in your browser.' },
    ],
  },
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
  {
    ...tool({ slug: 'resize-image', name: 'Resize Image', desc: 'Scale to exact pixel dimensions', category: 'image', icon: 'resize', verb: 'Resize', accept: 'image/*',
      options: [num('w', 'Width', 'e.g. 1200', 'px'), num('h', 'Height', 'auto', 'px', 'Leave blank to keep aspect ratio.')] }),
    steps: ['Drop your image into the box above.', 'Enter a width, a height, or both in pixels.', 'Hit “Resize Karo” and download.'],
    faqs: [
      { q: 'How do I keep the aspect ratio?', a: 'Fill in just one dimension — the other is calculated automatically.' },
      { q: 'Does resizing reduce quality?', a: 'Scaling down keeps images sharp. Scaling up can’t invent detail, so large upscales may look soft.' },
      { q: 'Is my image uploaded?', a: 'No — resizing happens entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'convert-image', name: 'Convert Image', desc: 'Switch between JPG, PNG and WebP', category: 'image', icon: 'convert', verb: 'Convert', multi: true, accept: 'image/*',
      options: [choice('fmt', 'Convert to', ['JPG', 'PNG', 'WebP'])] }),
    steps: ['Drop one or more images into the box above.', 'Pick the output format: JPG, PNG or WebP.', 'Hit “Convert Karo” and download each converted file.'],
    faqs: [
      { q: 'Which format should I choose?', a: 'JPG for photos, PNG when you need transparency or pixel-perfect graphics, WebP for the smallest files with great quality.' },
      { q: 'What happens to transparency in JPG?', a: 'JPG has no transparency — transparent areas are flattened onto white.' },
      { q: 'Are my images uploaded to convert them?', a: 'No — conversion happens entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'convert-webp', name: 'Convert to WebP', desc: 'Modern format, much smaller files', category: 'image', icon: 'convert', verb: 'Convert', multi: true, accept: 'image/*',
      options: [slider('q', 'Quality', 10, 100, 80, '%')] }),
    steps: ['Drop one or more JPG or PNG images into the box above.', 'Pick a quality — 80% is a great default.', 'Hit “Convert Karo” and download your WebP files.'],
    faqs: [
      { q: 'Why WebP?', a: 'WebP files are typically 25–35% smaller than JPG at the same visual quality, and every modern browser supports them.' },
      { q: 'Does WebP support transparency?', a: 'Yes — PNG transparency survives the conversion.' },
      { q: 'Is my image uploaded to convert it?', a: 'No — conversion happens entirely in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'crop-image', name: 'Crop Image', desc: 'Crop to a fixed ratio', category: 'image', icon: 'crop', verb: 'Crop', accept: 'image/*',
      options: [choice('ratio', 'Aspect ratio', ['1:1', '4:3', '16:9', 'Passport', 'Free'], 'Crops are centered. Free-form drawing is coming soon.')] }),
    steps: ['Drop your image into the box above.', 'Pick a ratio — square, 4:3, 16:9 or passport (35×45).', 'Hit “Crop Karo” and download the centered crop.'],
    faqs: [
      { q: 'Where is the crop taken from?', a: 'From the center of the image — the largest possible area at your chosen ratio.' },
      { q: 'What is the Passport ratio?', a: '35:45 — the standard passport/visa photo proportion used in most countries.' },
      { q: 'Can I drag my own crop box?', a: 'Not yet — a draw-your-own crop box is on the roadmap. Ratio crops are centered for now.' },
    ],
  },
  {
    ...tool({ slug: 'rotate-flip-image', name: 'Rotate & Flip', desc: 'Rotate or mirror any image', category: 'image', icon: 'flip', verb: 'Apply', accept: 'image/*',
      options: [choice('rot', 'Rotate', ['None', '90° right', '180°', '90° left']), choice('flip', 'Flip', ['None', 'Horizontal', 'Vertical'])] }),
    steps: ['Drop your image into the box above.', 'Pick a rotation, a flip, or both.', 'Hit “Apply Karo” and download.'],
    faqs: [
      { q: 'Can I rotate and flip at once?', a: 'Yes — the rotation is applied first, then the mirror.' },
      { q: 'Is the quality affected?', a: 'Rotation by 90° steps and flips are lossless operations on the pixels; only the final re-encode applies (at high quality).' },
      { q: 'Is my image uploaded?', a: 'No — everything happens in your browser.' },
    ],
  },
  {
    ...tool({ slug: 'strip-exif', name: 'Strip EXIF Data', desc: 'Remove metadata & location info', category: 'image', icon: 'exif', verb: 'Clean', multi: true, accept: 'image/*' }),
    steps: ['Drop one or more photos into the box above.', 'Hit “Clean Karo” — no options needed.', 'Download copies with all metadata removed.'],
    faqs: [
      { q: 'What gets removed?', a: 'Everything that isn’t pixels: GPS location, camera model, timestamps, software tags — the whole EXIF block.' },
      { q: 'Why should I strip EXIF before sharing?', a: 'Photos can silently carry your home location and daily patterns. Stripping metadata before posting keeps that private.' },
      { q: 'How does it work without uploading?', a: 'The photo is re-drawn onto a clean canvas in your browser — pixels survive, metadata doesn’t. Nothing is sent anywhere.' },
    ],
  },
  tool({ slug: 'watermark-image', name: 'Image Watermark', desc: 'Stamp text or a logo on photos', category: 'image', icon: 'watermark', verb: 'Watermark', multi: true, accept: 'image/*',
    options: [txt('wm', 'Watermark text', 'e.g. © Your Name'), slider('op', 'Opacity', 5, 100, 40, '%'), choice('pos', 'Position', ['Bottom right', 'Center', 'Tile'])] }),
  tool({ slug: 'favicon-generator', name: 'Favicon Generator', desc: 'One image → every favicon size', category: 'image', icon: 'img', verb: 'Generate', accept: 'image/*' }),
  tool({ slug: 'bulk-image', name: 'Bulk Compress & Resize', desc: 'Process many images at once', category: 'image', icon: 'img', verb: 'Process', multi: true, accept: 'image/*',
    options: [slider('q', 'Quality', 10, 100, 75, '%'), num('maxw', 'Max width (optional)', 'e.g. 1920', 'px'), choice('fmt', 'Format', ['Keep original', 'JPG', 'WebP'])] }),
];

/** Slugs of tools whose processing is implemented; others render "coming soon".
 *  Keep in sync with the processor map in src/lib/workers/worker.ts. */
export const liveTools = new Set<string>([
  'merge-pdf',
  'compress-image',
  'split-pdf',
  'reorder-pdf',
  'compress-pdf',
  'images-to-pdf',
  'rotate-pdf',
  'delete-pdf',
  'extract-pdf',
  'crop-pdf',
  'pdf-to-images',
  'pdf-to-text',
  'create-pdf',
  'convert-image',
  'convert-webp',
  'resize-image',
  'crop-image',
  'rotate-flip-image',
  'strip-exif',
]);

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
