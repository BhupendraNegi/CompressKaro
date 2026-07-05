Build "CompressKaro" — a fully client-side PDF & image utility web app, deployed 
as a static site on Vercel (also GitHub Pages compatible). No backend, no server 
uploads — 100% of file processing happens in the browser. Privacy is the core 
selling point: "Your files never leave your device."

STACK
- Astro (static output) + React islands for the interactive tool components
- Tailwind CSS, dark mode toggle (class strategy, persisted in localStorage)
- pdf-lib (PDF creation/modification), pdfjs-dist (rendering/previews),
  jsPDF (images→PDF), browser-image-compression + Canvas API (image tools),
  dnd-kit (drag-to-reorder), Web Workers for all heavy processing so the UI 
  never freezes (show progress bars)

ARCHITECTURE
- Every tool = its own static route (e.g., /merge-pdf, /compress-image) with 
  unique <title>, meta description, H1, a short "How to use" section (3-4 steps), 
  and 3-5 FAQs with FAQPage JSON-LD schema. Pages are static HTML; only the tool 
  widget hydrates (client:load).
- A single reusable ToolShell React component: drag-and-drop zone + file picker 
  (validates type/count), file thumbnail list, options panel, Process button 
  with progress state, and a Download result state with success animation.
- A live PDF viewer pane (pdfjs-dist): as soon as a PDF is loaded, render all 
  pages as scrollable/zoomable previews. Tools that operate on pages (delete, 
  extract, reorder, rotate, split) show clickable/selectable page thumbnails.
- Click-to-place overlay system: for watermark, page numbers, and signature 
  tools, the user clicks anywhere on the rendered page preview to place the 
  element, drags to reposition, and resizes with a corner handle. The placement 
  coordinates map to PDF coordinates for pdf-lib.
- Adding a new tool must be trivial: one config object (slug, title, meta, 
  FAQs, accepted file types, options schema) + one processing function.

PDF TOOLS (organize into categories: Organize, Convert, Optimize, Security, 
Annotate, Create)
1.  Merge PDF — up to 25 files, drag thumbnails to reorder
2.  Split PDF — by page range or extract every page as separate PDFs (zip output 
    using client-side zip, e.g., fflate)
3.  Compress PDF — re-render pages via canvas at reduced quality/scale for real 
    size reduction; show before/after sizes
4.  Rotate PDF — rotate all pages or selected pages 90/180/270
5.  Crop PDF — draw a crop box on the page preview, apply to selected/all pages
6.  Sign PDF — draw signature on a canvas (or type with cursive font, or upload 
    image), then click-to-place on any page
7.  Images to PDF — multiple images, reorder, page size options (A4/Letter/Fit)
8.  PDF to Images — export every page as PNG/JPG (zip if multiple)
9.  PDF to Text — extract text per page with copy button
10. Create PDF — blank text editor that outputs a formatted PDF
11. Annotate PDF — add text boxes, highlights, shapes (rect/ellipse/arrow), 
    freehand draw on page previews; flatten into the PDF
12. Watermark PDF — text or image watermark, opacity/rotation/position controls, 
    tile or single placement, click-to-place
13. Add Page Numbers — position presets, format (1, 1/N, Page 1 of N), start 
    number, font size
14. Header & Footer — custom text left/center/right on every page
15. Delete Pages — select page thumbnails to remove
16. Extract Pages — select pages to export as a new PDF
17. Reorder Pages — drag page thumbnails into a new order
18. Protect PDF — add password encryption
19. Unlock PDF — remove password (user provides the password)
20. PDF Metadata Editor — view/edit title, author, subject, keywords

IMAGE TOOLS
21. Compress Image — quality slider + "target size in KB" mode that iteratively 
    compresses until under target (critical feature)
22. Resize Image — pixels or percentage, lock-aspect-ratio toggle
23. Convert Image — JPG/PNG/WebP any direction
24. Crop Image — freeform + fixed ratios (1:1, 4:3, 16:9, passport)
25. Image Watermark — text/image overlay
26. Remove EXIF Data — strip metadata, privacy angle
27. Favicon Generator — one image → all standard sizes + webmanifest
28. Bulk Compress/Resize — process multiple images at once, zip download

SITE PAGES
- Homepage: hero with privacy tagline, trust badges (100% Browser-Based / No 
  Registration / Files Never Uploaded / Free Forever), a search bar that filters 
  the tool grid live, category filter tabs, and the full tool card grid
- "How It Works" section explaining client-side processing in plain language
- FAQ section on homepage with JSON-LD
- Footer: categorized links to every tool page (SEO sitemap-style)
- sitemap.xml, robots.txt, Open Graph + Twitter meta per page
- One reserved, non-intrusive ad slot component below each tool area 
  (placeholder div I can wire to AdSense later)

QUALITY REQUIREMENTS
- Mobile-first responsive; tool pages must be fully usable on phones
- Friendly error states: corrupt files, wrong type, password-protected PDFs 
  fed to non-unlock tools, files too large for device memory
- Everything keyboard-accessible; alt text; semantic HTML
- Lighthouse targets: 95+ performance and SEO on tool pages
- Clean modular TypeScript throughout

Start by scaffolding the project, the ToolShell pattern, and the homepage, then 
implement tools in this order: 1, 21, 7, 3, 2, 17 first (the highest-traffic 
ones), then the rest.