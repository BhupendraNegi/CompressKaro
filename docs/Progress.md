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
- [ ] `ci.yml` + Pages deploy green on GitHub — verify after first push to `origin/main`
      (repo: `github.com/BhupendraNegi/CompressKaro`; enable Pages → Source: GitHub Actions)

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

## Phase 2 — ToolShell + Merge PDF + Compress Image ⬜

- [ ] ToolShell island: empty → ready → processing → done; options-schema renderer; worker protocol
- [ ] Merge PDF (multi, drag-reorder, 25 cap) · Compress Image (quality + target-KB loop)
- [ ] Verify: e2e — merge two fixture PDFs → `merged.pdf`; compress fixture under target KB

## Phase 3 — PDF page infra + high-traffic tools ⬜

- [ ] pdfjs viewer + PdfPagePicker (thumbnails, selection, zoom)
- [ ] Compress PDF · Split PDF (zip) · Images to PDF · Reorder Pages
- [ ] Verify: per-tool e2e; real size reduction shown; split ranges → correct page counts

## Phase 4 — Page-operation tools ⬜

- [ ] Rotate PDF · Delete Pages · Extract Pages · Crop PDF (crop-box UI)
- [ ] Verify: e2e per tool; crop coordinates unit-tested against output dimensions

## Phase 5 — Convert & image suite ⬜

- [ ] PDF to Images · PDF to Text · Create PDF
- [ ] Convert Image · Convert to WebP · Resize · Crop Image · Rotate & Flip · Strip EXIF
- [ ] Verify: e2e per tool; conversions validated by decoding output in-test

## Phase 6 — Placement overlay & annotate ⬜

- [ ] PlacementOverlay (click-to-place, drag, resize; preview→PDF coord mapping)
- [ ] Sign · Annotate · Watermark PDF · Page Numbers · Header & Footer · Image Watermark
- [ ] Verify: coord-mapping unit tests at multiple zooms; watermark pixel-probe e2e

## Phase 7 — Security & extras ⬜

- [ ] Protect PDF · Unlock PDF (encryption spike: pdf-lib fork vs qpdf-wasm) · Metadata Editor
- [ ] Favicon Generator · Bulk Compress/Resize
- [ ] Verify: protect→unlock round-trip e2e; favicon zip complete

## Phase 8 — Hardening & polish ⬜

- [ ] A11y pass (keyboard, focus, aria-live, contrast AA)
- [ ] Error-state matrix across all tools (corrupt/wrong-type/encrypted/oversized)
- [ ] Lighthouse ≥ 95 perf+SEO on every tool page (record numbers here)
- [ ] Ad-slot component on tool pages; mobile sweep
