# CompressKaro — Build Log & Phase Tracker

Living record of what's been built, decisions taken, and how each phase was verified.
Phase definitions live in [Architecture.md §8](./Architecture.md#8-phased-build-plan).

Status legend: ⬜ not started · 🟡 in progress · ✅ done

---

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-05 | Stack: **Astro (static) + React islands**, Tailwind, pnpm, Node 22 | Per spec. ~30 SEO pages with one hydrated widget each — islands keep per-page JS minimal (Lighthouse 95+ target). Deliberate divergence from CronLens's Next.js. |
| 2026-07-05 | Deploy to **GitHub Pages** (not Vercel) | Free, in-repo, matches CronLens. Static output stays Vercel-compatible if PR previews are ever wanted. |
| 2026-07-05 | Serve from subpath `bhupendranegi.github.io/CompressKaro/`; `base` env-gated on `PAGES=true` | Local dev stays path-free; only CI builds with the subpath. Custom domain would remove this. |
| 2026-07-05 | Dev inside Docker on dedicated Colima profile **`compresskaro`**; `bin/` scripts as the only entry points | Mirrors CronLens ergonomics (idempotent, colored, teardown trap, free-port). Socket via `DOCKER_HOST`, no global context switch. No host Node/pnpm needed. |
| 2026-07-05 | Tool inventory = **spec ∪ design prototype = 30 tools** | See [Tool-Catalog.md](./Tool-Catalog.md) reconciliation. Prototype naming/options win where both define a tool. |
| 2026-07-05 | **Hinglish voice on by default** ("Merge Karo →", "Ho gaya!") | It's the brand. Copy centralized in one module so an English switch stays cheap. |
| 2026-07-05 | All processing in **Web Workers** with real progress events | Spec requirement; UI must never freeze, progress bar must be honest. |
| 2026-07-05 | Git commits: **no Claude co-author trailer, ever** | User convention (same as CronLens). |

---

## Infra pre-pass (this repo bootstrap, 2026-07-05) ✅

Created before Phase 0, borrowed from CronLens and adapted to Astro:

- `CLAUDE.md` — working conventions + project setup summary.
- `bin/setup`, `bin/dev`, `bin/test`, `bin/lint` — Colima profile `compresskaro`, port 4321,
  free-port fallback, teardown trap; host-pnpm auto-detect for CI.
- `.github/workflows/ci.yml` (lint + typecheck + test + build), `e2e.yml` (Playwright),
  `deploy.yml` (Pages: `PAGES=true` build → `.nojekyll` → publish `dist/`).
- `Dockerfile` (Node 22 alpine + corepack pnpm), `docker-compose.yml` (bind-mount, named
  `node_modules`/`pnpm_store` volumes, polling watch), `.dockerignore`.
- `docs/` — Architecture, Design-System, Tool-Catalog, Progress (this file).

**Note:** these become runnable at Phase 0 — `bin/setup`/CI need `package.json` +
`astro.config.mjs` to exist. Workflows will fail on pushes until Phase 0 lands; that's expected.

---

## Phase 0 — Scaffold & infra ✅ (local gates 2026-07-05; CI/Pages pending first push)

Goal: blank Astro page building; dev container serving; Vitest green; CI + Pages deploy green.

Path taken:
- Hand-scaffolded (no `create-astro`) to match the documented repo structure: `astro.config.mjs`
  (static output, env-gated `base`), Tailwind v4 via `@tailwindcss/vite`, React integration,
  strict tsconfig.
- Registry data model seeded in `src/tools/types.ts`; first pure-lib module `src/lib/files.ts`
  (`formatSize`, from the prototype) with 3 Vitest tests.
- Playwright wired with a homepage smoke spec (`e2e/smoke.spec.ts`) + `webServer` config.
- Minimal homepage + BaseLayout with the design tokens stubbed in `global.css` (full theme = Phase 1).
- ESLint 9 flat config (js + typescript-eslint + eslint-plugin-astro); needed a `process` global
  for root config files.

Verify gate:
- [x] `bin/setup` completes (Colima profile `compresskaro` up, image built, `pnpm-lock.yaml` extracted)
- [x] `bin/dev` serves `localhost:4321` from the container — HTTP 200, `<title>CompressKaro — Free PDF & Image tools</title>`
- [x] `bin/test` green (3 tests) · `bin/lint` passes (eslint + `astro check`: 0 errors)
- [x] `PAGES=true pnpm build` emits `dist/` with assets under `/CompressKaro/_astro/…`
- [x] `ci.yml` + Pages deploy green on GitHub (2026-07-05) — live at
      https://bhupendranegi.github.io/CompressKaro/

## Phase 1 — Design system & homepage ✅ (local gates 2026-07-05)

Path taken:
- Tokens mapped via Tailwind v4 `@theme inline` → utilities `bg-bg/surface/surface2`, `text-ink/mute`,
  `border-line`, `bg-accent(-soft)`, `shadow-card(-lg)`, `font-sans/serif`. Dark = `data-theme` on
  `<html>`, pre-paint inline script reads `ck-theme` from localStorage (no flash).
- Instrument Sans/Serif self-hosted via `@fontsource` (no Google Fonts request).
- Registry (`src/tools/registry.ts`) with all **30** tools (options schemas from the prototype)
  + `homeSections` / `footerColumns` helpers; `liveTools` set gates ToolShell vs coming-soon.
  Corrected the earlier "31 tools" count in docs — union is 30 (design 26 + spec-only 4).
- `[tool].astro` generates all 30 pages: meta/OG/canonical, hero, trust chips, Hinglish
  coming-soon card ("Ban raha hai…"), how-to + FAQ sections with FAQPage JSON-LD (render once
  each tool ships its content).
- Homepage: hero + Hinglish line, trust chips, live search (vanilla script, hides empty
  groups/sections, no-results state), categorized grid, "How it works", FAQ + JSON-LD.
- `@astrojs/sitemap`, robots.txt, canonical/OG/Twitter meta in BaseLayout. 404 page.
- Icon.astro ports the prototype's 23-glyph stroke set.

Verify gate:
- [x] `bin/test` green (8 tests incl. registry integrity: unique slugs, grid/footer completeness)
- [x] `bin/lint` clean (eslint + astro check, 0 errors)
- [x] Build: 32 pages (30 tools + home + 404), `sitemap-index.xml` emitted, FAQPage JSON-LD in
      home, coming-soon renders on tool pages
- [x] e2e specs written (search filter, theme persistence, card→tool page, footer links) — run in CI
- [ ] Lighthouse SEO ≥ 95 — measure after first Pages deploy

## Phase 2 — ToolShell + Merge PDF + Compress Image ✅ (local gates 2026-07-05)

Path taken:
- **ToolShell island** (`components/react/ToolShell.tsx` + FileList + OptionsPanel): the full
  empty → ready → processing → done/error flow from the design, options-schema renderer
  (slider w/ label maps, number+unit, text/password, choice pills), keyboard-operable dropzone,
  aria-live status, before/after sizes in the done note, multi-output download list.
- **Worker pipeline**: typed protocol (`lib/workers/protocol.ts`), per-run worker
  (`client.ts`), processor map with dynamic imports so each tool's engine code-splits
  (`worker.ts`). Needed `vite.worker.format = 'es'` — IIFE workers can't multi-chunk.
- **Merge PDF**: pdf-lib copyPages in list order, per-file progress. **Compress Image**:
  hand-rolled OffscreenCanvas engine (`lib/image/compress.ts`) — binary-search JPEG quality for
  target-KB, dimension downscale fallback; dropped `browser-image-compression` (decision below).
- File reorder: native HTML5 drag + up/down arrow buttons (keyboard/mobile), matching the
  prototype; dnd-kit deferred until PdfPagePicker needs it.
- Hinglish copy centralized in `lib/copy.ts`; friendly error mapping in `lib/errors.ts`.
- SEO steps + FAQs (FAQPage JSON-LD) shipped for both live tools; `liveTools` set gates the island.

Decisions:
- Compress Image always outputs **JPEG** (`{base}-compressed.jpg`, transparency flattened to
  white) — matches the prototype's naming contract; predictable results.
- Skipped `browser-image-compression`: it self-spawns workers/uses DOM canvas — our engine already
  runs in a worker; OffscreenCanvas gives the exact target-KB loop with zero deps.
- "Try a sample" dropzone link deferred to Phase 3 (needs bundled fixture files).

Verify gate:
- [x] `bin/test` green — 11 tests incl. **real merge engine** (2+3 pages → 5-page merged.pdf, corrupt-input rejection) via Node 22's File/Blob
- [x] `bin/lint` clean; build 32 pages + code-split worker chunk (`_astro/worker-*.js`)
- [x] Dev server: `/merge-pdf/` serves astro-island + dropzone markup
- [x] e2e written: merge → download → page count assert; corrupt-file friendly error; compress 1600×1200 noise photo → ≤ 50 KB download (OffscreenCanvas needs a real browser → runs in CI)

## Phase 3 — PDF page infra + high-traffic tools ✅ (local gates 2026-07-05)

Path taken:
- **Shared PDF infra:** `lib/pdf/ranges.ts` (range + order parsers, friendly errors),
  `lib/pdf/render.ts` (pdfjs → OffscreenCanvas → JPEG rasterizer, worker-safe, keeps original
  page dimensions in points), `lib/zip.ts` (fflate).
- **PdfPagePicker** React panel: pdfjs thumbnails on the main thread, drag-to-reorder +
  arrow buttons, emits the same "3, 1, 2" text the order option accepts (graceful fallback if
  previews fail). Wired via a lazy `toolPanels` map so pdfjs only loads on tools that use it
  (verified: separate `PdfPagePicker` + `pdf.worker` chunks in the build).
- **Split PDF**: ranges → one PDF each → zip; blank input = every page separately.
- **Reorder Pages**: thumbnails or typed order; unmentioned pages append in original order.
- **Compress PDF**: re-render each page via pdfjs at level-based scale/quality
  (Light 1.5×/0.75 · Balanced 1.2×/0.6 · Strong 1.0×/0.45), rebuild with pdf-lib at true page
  size; target-KB mode retries lower settings up to 3× and keeps the smallest.
- **Images to PDF**: JPG/PNG embed directly, WebP re-encoded in-worker; A4/Letter with margins +
  auto/forced orientation, or "Fit image" pages; single input names output after the file.
- SEO steps + FAQs shipped for all four; `liveTools` now 6.

Decisions:
- **Dropped jsPDF** — pdf-lib covers images→PDF; one less dependency.
- Compress PDF makes pages non-selectable images (the honest trade-off for real size cuts) —
  stated plainly in the tool's FAQ.

Verify gate:
- [x] `bin/test` green — 23 tests; real engines exercised in Node: split zip contents + page
      counts, reorder verified by distinct page sizes, images-to-pdf page count/size, parsers
- [x] `bin/lint` clean; build 32 pages, pdfjs code-split, islands on all 4 new tool pages
- [x] e2e written for all four (split zip download, compress page-count round-trip, reorder with
      thumbnail render check, images-to-pdf from generated canvases) — run in CI

## Phase 4 — Page-operation tools ✅ (local gates 2026-07-05)

Path taken:
- **PdfPagePicker gained a `select` mode** — click thumbnails to toggle pages; the selection
  writes into the tool's `pages` text option so thumbnails and typed input stay in sync
  (aria-pressed on each page button). `toolPanels` entries now carry `mode`.
- `parsePages` added to `lib/pdf/ranges.ts` ("2, 7-9" → flat sorted 0-based indices).
- **Rotate PDF** (angle on all/selected, additive to existing rotation), **Delete Pages**
  (refuses to delete all; requires a selection), **Extract Pages** (requires a selection),
  **Crop PDF** (even mm trim via crop box, per-page bounds check).
- Registry: rotate/crop `scope` choices replaced by the shared pages selection (blank = all);
  SEO steps + FAQs for all four; `liveTools` now 10.

Decisions:
- Crop v1 = **even margin trim** (matches the prototype's slider); a draw-your-own crop box
  needs the Phase 6 overlay infra and is deferred there (also stated in the tool FAQ).
- Crop sets the **crop box** (non-destructive, viewers respect it) rather than re-rendering.

Verify gate:
- [x] `bin/test` green — 32 tests: rotation per-page angles, delete order/refusals, extract
      subsets, crop-box mm→pt coordinates + too-big-margin rejection, parsePages
- [x] `bin/lint` clean; build green, islands on all 4 pages
- [x] e2e: thumbnail-click selection → only page 2 rotated (asserts real output angles);
      typed delete selection → page count — run in CI

## Phase 5 — Convert & image suite ✅ (local gates 2026-07-05)

Path taken:
- **`lib/image/transform.ts`** — one decode→transform→encode pipeline (center-crop ratio,
  resize w/aspect-keep, 90° rotations, flips, format+quality) powering six image tools.
- **`lib/pdf/render.ts` generalized**: `renderPages` now takes PNG/JPEG type; added
  `extractText` (pdfjs getTextContent per page).
- **PDF → Images** (2× scale, single page direct / multi zipped), **PDF → Text** (plain or
  Markdown with per-page headings), **Create PDF** (`lib/pdf/textToPdf.ts`: glyph-accurate word
  wrap + pagination + title metadata).
- **ToolShell: optional-file flow** — `optionalFile` config + "No file? Just start typing
  instead →" link, `textarea` option type (Create PDF's editor).
- **Convert Image / Convert to WebP / Resize / Crop (ratio) / Rotate & Flip / Strip EXIF** —
  all thin wrappers over the transform pipeline; EXIF stripping = canvas re-encode.
- SEO steps + FAQs for all nine; `liveTools` now **19 of 30**.

Decisions:
- Crop Image v1 = centered ratio crops (1:1/4:3/16:9/Passport 35:45); drawn crop box deferred
  to the Phase 6 overlay work, stated in the FAQ. Default ratio 1:1 (Free errors with guidance).
- PDF→Text does no OCR (scanned PDFs out of scope, stated in FAQ); per-page copy-button viewer
  deferred — v1 ships the text file download.

Verify gate:
- [x] `bin/test` green — 38 tests (wrapText width bounds + hard-split, buildTextPdf pagination/
      title, create-pdf typed vs file input + empty rejection, all Phase 3/4 suites)
- [x] `bin/lint` clean; build 32 pages, islands live on all new tool pages
- [x] e2e: convert-webp name, resize aspect flow, pdf-to-text extracts drawn text verbatim,
      create-pdf no-file flow — run in CI

## Phase 6 — Placement overlay & annotate ✅ (local gates 2026-07-05; annotate → Phase 7)

Path taken:
- **Panel API generalized**: panels now receive `{file, values, onChange(key, value)}` so one
  panel can drive multiple options (PdfPagePicker adapted; entries carry static props).
- **SignPanel — the click-to-place overlay**: draw-pad (pointer events) or typed name rendered
  in italic serif → PNG data URL; pdfjs page preview with click/drag placement + size slider;
  placement stored as resolution-independent fractions `{page, x, y, w}`. `sign-pdf/process`
  maps preview fractions → PDF points (bottom-left origin flip), stamps the embedded PNG.
- **Watermark PDF** (diagonal 45° / center / bottom, opacity, size auto-scaled to page),
  **Add Page Numbers** (3 positions × 3 formats), **Header & Footer** (centered running text),
  **Image Watermark** (canvas stamp: bottom-right / center / rotated tile, stroke+fill for
  contrast on any photo).
- SEO steps + FAQs for the five; `liveTools` now **24 of 30**.

Decisions:
- **Annotate PDF moved to Phase 7** — it needs per-page freehand stroke capture (a multi-page
  variant of the sign overlay); shipping five polished tools beat six rushed ones.
- Sign/watermark honesty in FAQs: stamped signature ≠ cryptographic signature; text-only PDF
  watermarks for now.

Verify gate:
- [x] `bin/test` green — 43 tests (sign coord mapping + embed-size growth + error paths,
      watermark/page-number/header-footer stampers incl. all formats)
- [x] `bin/lint` clean; build green; islands on all 5 new pages; annotate-pdf still coming-soon
- [x] e2e: full sign flow (draw stroke → click preview → placement marker → signed download),
      watermark flow — run in CI

## Phase 7 — Security & extras ✅ (local gates 2026-07-05) — **all 30 tools live**

Path taken:
- **Encryption spike resolved → `@cantoo/pdf-lib`** (pdf-lib fork with encrypt/decrypt).
  Imported only by protect/unlock, so the fork code-splits away from every other tool.
  **Protect PDF** (password ×2, min length) · **Unlock PDF** (load with password → save plain;
  wrong-password mapped to friendly copy).
- **PDF Metadata Editor** — title/author/subject/keywords; blank keeps existing.
- **Favicon Generator** — center-square crop → 16/32/48/180/192/512 PNGs, hand-built
  `favicon.ico` (PNG-in-ICO container, `lib/image/ico.ts`), `site.webmanifest`, README with the
  HTML snippet — one zip.
- **Bulk Compress & Resize** — quality + never-upscaling `maxWidth` (added to the transform
  pipeline) + format force, zipped.
- **Annotate PDF** (deferred from Phase 6) — AnnotatePanel draws pen/highlighter strokes on a
  transparent canvas over the pdfjs page preview, per-page PNGs stored in an `inks` JSON option,
  flattened full-bleed in the worker. Pen colors red/blue/black; highlighter translucent yellow.
- SEO steps + FAQs for all six; `liveTools` = **30 of 30** — no "Ban raha hai…" pages left
  (verified: 0 in the built site).

Verify gate:
- [x] `bin/test` green — 51 tests incl. **protect→unlock round trip in Node**: encrypted output
      rejected by plain pdf-lib, unlocked with the right password, wrong password rejected;
      metadata fields; annotate ink flattening + empty rejection; ICO directory bytes
- [x] `bin/lint` clean; build 32 pages, islands everywhere, zero coming-soon pages
- [x] e2e: favicon zip + bulk zip (max-width flow) — run in CI

## Phase 8 — Hardening & polish ✅ (local gates 2026-07-05)

Path taken:
- **Wrong-type guard**: drag-and-drop bypasses the input `accept` filter, so `matchesAccept`
  (extensions, mime wildcards, exact types) re-validates in ToolShell; rejected files show a
  friendly `role="status"` notice naming the file and what the tool takes.
- **Oversize soft warning** at 100 MB (in-memory processing guardrail) — warns, doesn't block.
- **Found & fixed a real Pages bug**: Astro's `BASE_URL` has no trailing slash under a subpath,
  so every internal link rendered `/CompressKaromerge-pdf/`. Normalized in `lib/paths.ts`,
  used by all layouts/pages/components; verified correct links in both local and `PAGES=true`
  builds.
- **AdSlot** component (labeled placeholder, diagonal-stripe 728×90/responsive) below the tool
  area on every tool page, per spec — ready to wire to AdSense.
- Global `:focus-visible` accent outline; error/status notices are `role="status"`;
  `prefers-reduced-motion` already in the base CSS.
- e2e: wrong-type drop shows the notice without leaving the empty phase; ad slot visible.

### CI stabilization (2026-07-05, post-first-push)

First full CI run surfaced two real bugs, both fixed and verified (24/24 e2e in the Playwright
container, then all three workflows green on GitHub):
- **Dev-toolbar interference** — e2e ran against `pnpm dev`, whose Astro toolbar overlays every
  page (own h1s/buttons) and broke strict-mode locators. E2E now tests the production build
  (`pnpm build && pnpm preview`); toolbar disabled project-wide.
- **pdfjs fake-worker failure** — inside the processing worker, pdfjs's environment sniffing
  picked its same-thread "fake worker" mode and died with an *empty* error (blank error card),
  breaking Compress PDF and PDF to Text in real browsers. Fixed by handing pdfjs a real nested
  worker via Vite's `?worker` import (`GlobalWorkerOptions.workerPort`). Worker now also surfaces
  unhandled rejections/uncaught errors as friendly messages instead of dying silently.

**Live:** https://bhupendranegi.github.io/CompressKaro/ — CI, E2E, and Pages deploy all green
on `main` (2026-07-05).

Remaining (needs the deployed site):
- [ ] Lighthouse ≥ 95 perf+SEO per page — measure on the live Pages URL, record here
- [ ] Real-device mobile sweep

Verify gate:
- [x] `bin/test` green — 52 tests (matchesAccept matrix added)
- [x] `bin/lint` clean; local AND `PAGES=true` builds verified link-correct
- [x] e2e error-state + ad-slot specs written — run in CI
