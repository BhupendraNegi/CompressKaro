# CompressKaro — Architecture & Setup Plan

Companion to [specifications.md](./specifications.md) (the product spec) and
[Design-System.md](./Design-System.md) (the visual language extracted from the design prototype).
The spec defines *what* CompressKaro is; this defines *how* we build, run, and ship it.
The tool inventory lives in [Tool-Catalog.md](./Tool-Catalog.md); the living build log in
[Progress.md](./Progress.md).

---

## 1. Guiding constraint

CompressKaro is a **fully client-side PDF & image utility suite**. The core promise is
*"Your files never leave your device"* — 100% of file processing happens in the browser.

That one constraint drives every decision below:

- **No backend, no database, no auth, no uploads.** Ever. It's the selling point.
- The app is a **static bundle** — hostable on any CDN, deployed to **GitHub Pages**
  (Vercel-compatible if we ever want per-PR previews).
- All heavy processing runs in **Web Workers** so the UI never freezes.
- Docker/Colima is for **local dev parity only**, not the production artifact. GitHub Actions
  builds from source.

---

## 2. Stack (decided)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro (static output) + React islands** | Per spec. ~30 SEO-bearing static tool pages where only the tool widget hydrates (`client:load`) — exactly Astro's sweet spot. |
| Interactivity | React 19 islands (ToolShell, viewers, overlays) | Rich stateful widgets; everything else ships as zero-JS HTML. |
| Styling | **Tailwind CSS**, dark mode via `class` strategy persisted in `localStorage` | Per spec; tokens from the design system mapped to a Tailwind theme. |
| PDF engine | `pdf-lib` (create/modify), `pdfjs-dist` (render/previews), `jsPDF` (images→PDF) | Per spec. |
| Image engine | `browser-image-compression` + Canvas API | Per spec. |
| Zip output | `fflate` | Client-side zip for split/bulk/multi-page outputs. |
| Drag & drop reorder | `dnd-kit` | Per spec (file lists + page thumbnails). |
| Heavy work | **Web Workers** (module workers via Vite's `new Worker(new URL(...))`) | UI never freezes; progress messages drive the progress bar. |
| Package manager | **pnpm** | Fast, disk-efficient, plays well with Docker layer caching. |
| Runtime (container) | **Node 22 LTS** pinned in Docker | Reproducible builds regardless of host Node version. |
| Unit tests | **Vitest** | Core processing functions are pure TS — fast to unit test. |
| E2E | **Playwright** | Real file → process → download flows in a real browser. |
| Lint/format | ESLint + Prettier | Standard. |

**Note on the tension with CronLens:** the sibling CronLens project uses Next.js static export.
We deliberately diverge here because the spec calls for Astro and the shape of the product is
different — CronLens is one interactive page; CompressKaro is ~30 content/SEO pages each with one
hydrated island. Astro's islands model gives smaller JS payloads per page (Lighthouse 95+ target).
Everything *around* the framework (bin scripts, Colima profile, CI, Pages deploy) mirrors CronLens.

---

## 3. Architecture

Three critical design rules:

**Rule 1 — the tool registry.** Adding a tool must be trivial: **one config object + one
processing function**. The config carries slug, title, meta description, H1, tagline, category,
accepted types, multi-file flag, options schema, "How to use" steps, and FAQs. Astro's
`getStaticPaths` generates every tool page from the registry; the footer, homepage grid, search
index, and sitemap all derive from it. No tool is hand-wired anywhere.

**Rule 2 — pure processing core.** `src/lib/` is pure TypeScript with zero React/DOM-render
dependency (Canvas/OffscreenCanvas and File APIs are fine — they run in workers). Every tool's
`process.ts` is a function `(files, options, onProgress) → result` that runs inside a Web Worker.
UI components stay thin and render what the core returns.

**Rule 3 — one shell, many tools.** A single reusable **ToolShell** React island implements the
four-phase flow from the design — `empty → ready → processing → done` — with the dropzone,
file list (drag-to-reorder), options panel (slider/number/text/choice controls rendered from the
options schema), progress state, and download/success state. Tools never reimplement chrome.

```
Astro static page (per tool, SEO content pre-rendered)
  └─ <ToolShell client:load config={tool}>        ← the only hydrated island
        │ files + options
        ▼
     Worker (src/lib/workers/)                     ← heavy lifting off the main thread
        pdf-lib / pdfjs-dist / jsPDF / canvas / browser-image-compression / fflate
        │ progress events … result blob(s)
        ▼
     ToolShell renders progress → done → download
```

Two shared sub-systems layer on top of ToolShell for the PDF tools:

- **PdfPagePicker** — pdfjs-dist renders all pages as scrollable/zoomable thumbnails; tools that
  operate on pages (delete, extract, reorder, rotate, split, crop) make thumbnails
  clickable/selectable/drag-reorderable.
- **PlacementOverlay** — click-to-place system for watermark, page numbers, signature, and
  annotations: click the rendered preview to place, drag to reposition, corner-handle to resize.
  Overlay coordinates map preview-space → PDF-space for pdf-lib.

---

## 4. Repo structure

```
CompressKaro/
├─ src/
│  ├─ pages/
│  │  ├─ index.astro              # homepage: hero, trust chips, live search, tool grid, FAQ
│  │  ├─ [tool].astro             # every tool page, generated from the registry
│  │  └─ 404.astro
│  ├─ layouts/
│  │  └─ BaseLayout.astro         # head/meta/OG/JSON-LD, header, footer, theme script
│  ├─ components/
│  │  ├─ astro/                   # static: Header, Footer, TrustChips, HowTo, FaqBlock, AdSlot
│  │  └─ react/                   # islands: ToolShell, Dropzone, FileList, OptionsPanel,
│  │                              #   ProgressCard, DoneCard, PdfPagePicker, PlacementOverlay,
│  │                              #   SignaturePad, CropBox, ToolSearch (homepage island)
│  ├─ tools/                      # THE registry (Rule 1)
│  │  ├─ types.ts                 # ToolConfig, OptionSchema, ProcessFn, ToolResult
│  │  ├─ registry.ts              # ordered list of all tools; single source of truth
│  │  └─ <tool-id>/
│  │     ├─ config.ts             # slug, meta, category, accept, options, steps, FAQs
│  │     └─ process.ts            # pure processing function (runs in a worker)
│  ├─ lib/                        # framework-agnostic core (Rule 2)
│  │  ├─ pdf/                     # load/save, page ops, coord mapping, encryption
│  │  ├─ image/                   # compress-to-target-KB loop, resize, convert, exif
│  │  ├─ zip.ts                   # fflate helpers
│  │  ├─ files.ts                 # validation, size formatting, output naming
│  │  └─ workers/                 # worker entry + typed postMessage protocol
│  └─ styles/                     # Tailwind theme mapped from Design-System tokens
├─ public/                        # favicons, og images, robots.txt
├─ e2e/                           # Playwright specs
├─ bin/                           # setup / dev / test / lint (supported entry points)
├─ .github/workflows/             # ci.yml · e2e.yml · deploy.yml
├─ Dockerfile                     # dev image (Node 22 + pnpm) — NOT the deploy artifact
├─ docker-compose.yml             # dev service w/ hot reload (polling)
├─ astro.config.mjs               # static output + env-gated base for Pages
├─ vitest.config.ts
├─ playwright.config.ts
└─ package.json
```

---

## 5. Local dev: Colima + Docker

Identical pattern to CronLens: reproducible dev inside Docker, isolated in a dedicated **Colima
profile `compresskaro`** so it never collides with other projects' VMs/ports. **No host toolchain
required** — no local Node/pnpm; everything runs in the container.

### `bin/` scripts (the supported entry points)

Each script points docker at the `compresskaro` profile's socket via `DOCKER_HOST` (no global
`docker context` switch), with colored, idempotent output.

```bash
bin/setup      # one-time: start Colima profile, build dev image, extract pnpm-lock.yaml
bin/dev        # dev server → http://localhost:4321 (Ctrl-C tears the container down)
bin/test       # run the vitest suite (extra args pass through, e.g. bin/test --watch)
bin/lint       # eslint + tsc --noEmit
```

- `bin/dev` picks the next free host port if 4321 is taken (`PORT=5000 bin/dev` or `bin/dev 5000`
  to force one) and installs a cleanup trap so `docker compose down` always runs on exit.
- `bin/lint` / `bin/test` auto-detect a host `pnpm` (used in CI) and otherwise run in the container.
- **4321** is Astro's default dev port. The `dev` script binds `--host 0.0.0.0` so the container
  port is reachable from the host.

**File watching:** hot reload across the Colima VM mount needs polling — compose sets
`CHOKIDAR_USEPOLLING=true` (Vite/chokidar). Slightly higher CPU, reliable reload.

**Lockfile discipline (learned the hard way on CronLens):** with no host pnpm, regenerate the
lockfile after any `package.json` change with
`docker compose run --rm web pnpm install --lockfile-only` (writes to the bind-mounted repo).
Do **not** rely on extracting it from the image — that drifts and breaks CI with
`ERR_PNPM_OUTDATED_LOCKFILE`.

---

## 6. Deployment: GitHub Pages

**The Docker image is *not* the deploy artifact.** GitHub Actions builds the static site on CI
and publishes it to Pages. The spec mentions Vercel; GitHub Pages is our primary (free, in-repo,
matches CronLens), and the static output remains Vercel-compatible if per-PR previews are ever
wanted.

### Flow

1. `astro build` emits a static site into `./dist`.
2. `.github/workflows/deploy.yml` on push to `main`: install → build (`PAGES=true`) → drop
   `.nojekyll` → upload `dist/` → deploy via `actions/deploy-pages`.
3. No env vars, no secrets, zero backend.

### Static config required for Pages

Served from a project subpath (`bhupendranegi.github.io/CompressKaro/`) unless a custom domain is
attached, so `astro.config.mjs` needs the base env-gated (local dev stays path-free):

```js
export default defineConfig({
  output: 'static',
  site: 'https://bhupendranegi.github.io',
  base: process.env.PAGES ? '/CompressKaro' : '/',
});
```

`.nojekyll` stops the Jekyll pipeline from stripping `_astro/` assets. All internal links must go
through Astro's base-aware helpers (`import.meta.env.BASE_URL`) — a classic subpath footgun.
`sitemap.xml` / `robots.txt` / canonical URLs derive from `site` + `base`.

---

## 7. Testing strategy

- **Unit (Vitest)** — the heart of it, all in `src/lib/` and `src/tools/*/process.ts`: page-range
  parsing (`1-3, 5, 8-10`), output naming, compress-to-target-KB convergence loop, coordinate
  mapping (preview→PDF space), EXIF stripping, zip assembly. Processing functions get fed real
  small fixture files (tiny PDFs/PNGs committed under `e2e/fixtures/`).
- **E2E (Playwright)** — one spec per shipped tool at minimum: upload fixture → set options →
  process → assert a download is produced with the expected name/type; plus homepage search
  filtering, dark-mode persistence, and friendly error states (corrupt file, wrong type,
  password-protected PDF fed to a non-unlock tool).
- **CI** (`ci.yml`) on every PR/main push: `pnpm install --frozen-lockfile` → `bin/lint` →
  `pnpm test` → `pnpm build`. **E2E** (`e2e.yml`) runs Playwright with Chromium. Both use pnpm
  directly on the runner — no Docker in CI.

---

## 8. Phased build plan

Each phase has a concrete verify gate. Tool SEO content (title, meta, H1, how-to, FAQs + JSON-LD)
ships **with each tool** as part of its config — it is not a separate phase. Order of tools follows
the spec's traffic priority: merge-pdf, compress-image, images-to-pdf, compress-pdf, split-pdf,
reorder-pages first. Track status in [Progress.md](./Progress.md).

**Phase 0 — Scaffold & infra** — Astro + React + Tailwind + Vitest wired; empty homepage; registry
`types.ts` seeded; Docker/bin/CI/deploy all functional.
→ *verify:* `bin/dev` serves a page at `localhost:4321` from the container; `bin/test` green;
`ci.yml` green; Pages deploy publishes the blank page.

**Phase 1 — Design system & homepage** — tokens → Tailwind theme; Instrument Sans/Serif; sticky
header + theme toggle (persisted); hero + trust chips; live search island filtering the grid;
categorized tool grid + footer columns rendered **from the registry** (cards for unbuilt tools link
to a "coming soon" state); homepage FAQ + JSON-LD; sitemap/robots/OG.
→ *verify:* visual parity with the design prototype in light & dark; search filters live;
theme survives reload; Lighthouse SEO ≥ 95 on the homepage.

**Phase 2 — ToolShell + first tools** — ToolShell island with the four-phase flow, options-schema
renderer, worker protocol with progress events, output naming, error states. Ship **Merge PDF**
(multi-file, drag-to-reorder, 25-file cap) and **Compress Image** (quality slider + iterative
target-KB mode — the critical feature).
→ *verify:* Playwright merges two fixture PDFs and downloads `merged.pdf`; compresses a fixture
JPG under a target KB; UI stays responsive during processing (worker, progress bar advances).

**Phase 3 — PDF page infrastructure + high-traffic tools** — pdfjs-dist viewer pane +
PdfPagePicker (thumbnails, selection, zoom); ship **Images to PDF** (page size/orientation),
**Compress PDF** (canvas re-render pipeline, before/after sizes), **Split PDF** (ranges → zip via
fflate), **Reorder Pages** (drag thumbnails).
→ *verify:* per-tool e2e specs pass; compress shows real size reduction on the fixture; split
`1-2,3` yields a zip with the right page counts.

**Phase 4 — Page-operation tools** — reuse PdfPagePicker selection: **Rotate PDF** (all/selected),
**Delete Pages**, **Extract Pages**, **Crop PDF** (draw crop box on preview, apply to
selected/all).
→ *verify:* e2e specs; crop-box coordinates verified against output page dimensions in a unit test.

**Phase 5 — Convert & image suite** — **PDF to Images** (PNG/JPG, zip), **PDF to Text** (per page,
copy button), **Create PDF** (text editor → formatted PDF), **Convert Image** (JPG/PNG/WebP),
**Convert to WebP**, **Resize Image** (px/%, lock-aspect), **Rotate & Flip**, **Strip EXIF**.
→ *verify:* e2e specs; conversion round-trips validated by decoding the output in-test.

**Phase 6 — Placement overlay & annotate** — PlacementOverlay (click-to-place, drag, corner-resize,
preview→PDF coord mapping); **Sign PDF** (draw/type/upload signature), **Annotate PDF** (text,
highlight, shapes, freehand; flattened), **Watermark PDF** (text/image, opacity/rotation,
tile/single), **Add Page Numbers**, **Header & Footer**, **Image Watermark**.
→ *verify:* unit tests for coord mapping at multiple zoom levels; e2e places a watermark and
asserts it renders in the output (pdfjs re-render + pixel probe).

**Phase 7 — Security & extras** — **Protect PDF** (password encryption), **Unlock PDF**,
**PDF Metadata Editor**, **Favicon Generator** (all standard sizes + webmanifest, zip), **Bulk
Compress/Resize** (multi-image, zip).
→ *verify:* protect→unlock round-trip e2e; favicon zip contains every documented size.

**Phase 8 — Hardening & polish** — full a11y pass (keyboard, focus, alt text, semantic HTML);
friendly-error audit across all tools (corrupt/oversized/wrong-type/encrypted inputs); Lighthouse
95+ performance & SEO on every tool page; ad-slot component below tool areas (placeholder for
AdSense); mobile usability sweep.
→ *verify:* Lighthouse CI numbers recorded in Progress.md; error-state e2e matrix green.

---

## 9. Decisions & open questions

Resolved (see Progress.md decisions log for dates):

1. **Astro over Next.js** — per spec; islands minimize per-page JS across ~30 pages.
2. **GitHub Pages** primary deploy; Vercel remains a drop-in option.
3. **Tool inventory = spec ∪ design prototype** (30 tools) — see Tool-Catalog.md for the diff.
4. **Hinglish voice on by default** ("Merge Karo", "Ho gaya!") exactly as the design prototype;
   copy lives in one module so an English-only switch stays cheap.

Open (decide when the phase arrives):

1. **PDF encryption library** — pdf-lib doesn't encrypt; likely `@cantoo/pdf-lib` fork or
   `qpdf-wasm` for Protect/Unlock (Phase 7 spike).
2. **OCR / scanned PDFs** — out of scope for PDF-to-Text v1; revisit if demand shows.
3. **File-size guardrails** — per-device memory limits; start with a soft warning at ~100 MB
   input and measure.
4. **Custom domain** — would remove the `base` subpath entirely; decide before serious SEO push.
