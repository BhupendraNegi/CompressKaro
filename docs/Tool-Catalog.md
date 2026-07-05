# CompressKaro — Tool Catalog

Single source of truth for the tool inventory: the union of the spec
([specifications.md](./specifications.md), 28 tools) and the design prototype (26 tools),
reconciled below — **30 tools total**. Slugs/names/taglines/options come from the prototype where
it defined them (they're already user-tested copy); spec-only tools get consistent equivalents.
`Phase` refers to [Architecture.md §8](./Architecture.md#8-phased-build-plan).

Every tool page carries its own SEO bundle (unique title, meta description, H1, 3–4 step
"How to use", 3–5 FAQs with FAQPage JSON-LD) defined in its `config.ts` — written when the tool
ships.

Option types: `slider` · `number` (+unit) · `text` / `password` · `choice` (pills).

---

## PDF — Organize

| Slug | Name | Tagline | Multi | Options | Output | Phase |
|---|---|---|---|---|---|---|
| `merge-pdf` | Merge PDF | Combine up to 25 PDFs into one file | ✅ (≤25) | — (drag-to-reorder is the UI) | `merged.pdf` | **2** |
| `split-pdf` | Split PDF | Split by page ranges into separate files | – | text `ranges` "e.g. 1-3, 5, 8-10" (each range → separate PDF); mode: every-page-as-PDF | `{base}-split.zip` | **3** |
| `reorder-pdf` | Reorder Pages | Rearrange pages in any order | – | visual drag of page thumbnails (text order fallback "3, 1, 2, 4") | `{base}-reordered.pdf` | **3** |
| `extract-pdf` | Extract Pages | Pull selected pages into a new PDF | – | thumbnail selection (text fallback "1, 4-6") | `{base}-extracted.pdf` | **4** |
| `delete-pdf` | Delete Pages | Remove unwanted pages from a PDF | – | thumbnail selection (text fallback "2, 7-9") | `{base}-deleted.pdf` | **4** |
| `rotate-pdf` | Rotate PDF | Rotate pages by 90°, 180° or 270° | – | choice `angle` (90° right/180°/90° left) · choice `scope` (All/Selected pages) | `{base}-rotated.pdf` | **4** |
| `crop-pdf` | Crop PDF | Trim margins on every page | – | crop box drawn on preview · choice `scope` (All/Current page) · slider `margin` 0–50 mm | `{base}-cropped.pdf` | **4** |

## PDF — Convert & Create

| Slug | Name | Tagline | Multi | Options | Output | Phase |
|---|---|---|---|---|---|---|
| `images-to-pdf` | Images to PDF | Turn JPG, PNG or WebP into one PDF | ✅ | choice `size` (A4/Letter/Fit image) · choice `orient` (Auto/Portrait/Landscape) | `images.pdf` | **3** |
| `pdf-to-images` | PDF to Images | Export every page as PNG or JPG | – | choice `fmt` (PNG/JPG) · slider `q` 10–100% | `{base}-pages.zip` | **5** |
| `pdf-to-text` | PDF to Text | Extract all text from a PDF | – | choice `fmt` (Plain text/Markdown); per-page copy buttons | `{base}.txt` | **5** |
| `create-pdf` | Create PDF | Write text and save it as a PDF | – | text `title` · choice `size` (A4/Letter); rich text editor UI | `{title}.pdf` | **5** |

## PDF — Optimize & Security

| Slug | Name | Tagline | Multi | Options | Output | Phase |
|---|---|---|---|---|---|---|
| `compress-pdf` | Compress PDF | Shrink file size, keep the quality | – | slider `level` 1–3 (Light/Balanced/Strong) · number `target` KB (optional, "we'll get as close as possible"); shows before/after sizes | `{base}-compressed.pdf` | **3** |
| `protect-pdf` | Protect PDF | Add password encryption | – | password `pw` + `pw2` confirm | `{base}-protected.pdf` | **7** |
| `unlock-pdf` | Unlock PDF | Remove a password you know | – | password `pw` ("Only works on PDFs whose password you have.") | `{base}-unlocked.pdf` | **7** |
| `pdf-metadata` | PDF Metadata Editor | View & edit title, author, keywords | – | text fields: title, author, subject, keywords | `{base}-metadata.pdf` | **7** |

## PDF — Annotate & Edit

| Slug | Name | Tagline | Multi | Options | Output | Phase |
|---|---|---|---|---|---|---|
| `sign-pdf` | Sign PDF | Draw and place your signature | – | choice `mode` (Draw/Type/Upload) · text `name`; click-to-place on preview | `{base}-signed.pdf` | **6** |
| `annotate-pdf` | Annotate PDF | Highlight, draw and add notes | – | choice `mode` (Highlight/Note/Draw) + shapes (rect/ellipse/arrow); flattened output | `{base}-annotated.pdf` | **6** |
| `watermark-pdf` | Watermark PDF | Stamp text across every page | – | text `wm` (or image) · slider `op` 5–100% · rotation · choice `pos` (Diagonal/Center/Bottom) · tile/single · click-to-place | `{base}-watermarked.pdf` | **6** |
| `page-numbers-pdf` | Add Page Numbers | Number every page, your style | – | choice `pos` (Bottom center/Bottom right/Top right) · choice `fmt` (1, 2, 3 / Page 1 of N / – 1 –) · start number · font size | `{base}-numbered.pdf` | **6** |
| `header-footer-pdf` | Header & Footer | Add running text to every page | – | text `h` header · text `f` footer (left/center/right placement) | `{base}-hf.pdf` | **6** |

## Image Tools

| Slug | Name | Tagline | Multi | Options | Output | Phase |
|---|---|---|---|---|---|---|
| `compress-image` | Compress Image | Shrink JPG, PNG or WebP files | ✅ | slider `q` 10–100% · number `target` KB — **iterative compress-until-under-target is the critical feature** | `{base}-compressed.{ext}` | **2** |
| `resize-image` | Resize Image | Scale to exact pixel dimensions | – | number `w`/`h` px or % · lock-aspect toggle ("Leave blank to keep aspect ratio.") | `{base}-resized.{ext}` | **5** |
| `convert-image` | Convert Image | Switch between JPG, PNG and WebP | ✅ | choice `fmt` (JPG/PNG/WebP) | `{base}.{fmt}` | **5** |
| `convert-webp` | Convert to WebP | Modern format, much smaller files | ✅ | slider `q` 10–100% | `{base}.webp` | **5** |
| `crop-image` | Crop Image | Crop free-form or to a ratio | – | choice `ratio` (Free/1:1/4:3/16:9/Passport) + crop box UI | `{base}-cropped.{ext}` | **5** |
| `rotate-flip-image` | Rotate & Flip | Rotate or mirror any image | – | choice `rot` (None/90° right/180°/90° left) · choice `flip` (None/Horizontal/Vertical) | `{base}-rotated.{ext}` | **5** |
| `strip-exif` | Strip EXIF Data | Remove metadata & location info | ✅ | — (privacy angle in page copy) | `{base}-clean.{ext}` | **5** |
| `watermark-image` | Image Watermark | Stamp text or a logo on photos | ✅ | text/image mode · opacity · position · click-to-place | `{base}-watermarked.{ext}` | **6** |
| `favicon-generator` | Favicon Generator | One image → every favicon size | – | — (generates all standard sizes + `site.webmanifest`) | `favicons.zip` | **7** |
| `bulk-image` | Bulk Compress & Resize | Process many images at once | ✅ | quality slider · max dimensions · format | `{n}-images.zip` | **7** |

---

## Reconciliation notes (spec ⇄ design prototype)

- **In both (24):** everything not listed below.
- **Spec-only, added (5):** PDF Metadata Editor, Image Watermark, Favicon Generator,
  Bulk Compress/Resize, plus explicit Crop Image passport ratio.
- **Design-only, kept (2):** Convert to WebP (high-search-volume standalone page — an SEO twin
  of Convert Image) and Rotate & Flip Image.
- **Merged concepts:** the design's multi-file Compress Image covers part of the spec's "Bulk"
  item; `bulk-image` remains as a distinct SEO page combining compress+resize with zip output.
- Homepage groups follow the design prototype: *Organize · Convert · Optimize & Security ·
  Annotate & Edit* under **PDF Tools**, and a single group under **Image Tools**. Footer columns:
  Organize / Convert / Edit & Annotate / Optimize & Security / Image Tools.
- Sample files ("No file handy? Try a sample") ship as tiny bundled fixtures — PDFs
  (report/invoice/agreement style) and images — doubling as e2e fixtures.
