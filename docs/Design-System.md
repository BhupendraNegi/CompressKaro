# CompressKaro — Design System

Extracted from the design prototype (`CompressKaro Web App Design/CompressKaro.dc.html`,
2026-07-05). This is the authoritative visual + copy reference for implementation; the prototype
file itself stays in Downloads and is not committed. Implementation maps these tokens into the
Tailwind theme (Phase 1).

---

## 1. Brand & voice

- **Wordmark:** `Compress` (Instrument Sans, 700) + `Karo` (Instrument Serif, italic, accent
  color, slightly larger). Same treatment in header (20/22px) and footer (17/18px).
- **Voice: Hinglish, warm, confident.** On by default (prototype exposes a `hinglish` flag —
  keep copy centralized so an English-only mode stays cheap):
  - Hero line: *"Compress karo. Merge karo. Done."* (English fallback: "Compress. Merge. Done.")
  - Action button: `{Verb} Karo →` — e.g. "Merge Karo →", "Compress Karo →" (fallback: tool name)
  - Processing: *"Ho raha hai…"* · Done: *"Ho gaya!"*
- **Privacy reassurance everywhere:** hero subline "100% private — files never leave your
  device."; processing note "Working locally on your device — nothing is uploaded."; done-state
  footer "Your file was processed locally. Nothing was uploaded."; site footer "© 2026
  CompressKaro — all processing happens locally in your browser. We never see your files."
- **Trust chips** (home, large: pill buttons / tool page, small: dot + text):
  `100% free · Processed in your browser · No signup · No file limits`

## 2. Typography

| Role | Font | Notes |
|---|---|---|
| UI / body | **Instrument Sans** (400/500/600/700) | Helvetica/Arial fallback, antialiased |
| Display accents | **Instrument Serif** (400, italic) | Section H2s, tool-page H1, "Karo", hero line, Ho raha hai/Ho gaya |

Google Fonts today; **self-host via `@fontsource` in implementation** (Pages CSP-free, faster,
no third-party request — helps the Lighthouse target).

Scale (from prototype): home H1 `clamp(38px, 7.5vw, 68px)` weight 600, tracking −0.03em;
hero Hinglish line `clamp(24px, 4.5vw, 38px)` serif italic accent; section H2
`clamp(26px, 4vw, 34px)` serif 400; tool H1 `clamp(28px, 5vw, 38px)` serif 400; body 14–17px;
group labels 11px, 600, uppercase, letter-spacing 0.12em.

## 3. Color tokens

CSS custom properties, theme switched by `data-theme` on `<html>` (persisted as `ck-theme` in
localStorage).

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#faf9f7` | `#161311` |
| `--surface` | `#ffffff` | `#201c19` |
| `--surface2` | `#f4f2ee` | `#292420` |
| `--text` | `#1d1a17` | `#f3efeb` |
| `--muted` | `#7a736b` | `#a39a90` |
| `--line` | `#e8e4de` | `#332d28` |
| `--accent` | `oklch(0.60 0.19 25)` | `oklch(0.66 0.18 25)` |
| `--accent-ink` | `#ffffff` | `#1d1a17` |
| `--accent-soft` | `oklch(0.96 0.02 25)` | `oklch(0.28 0.05 25)` |
| `--shadow` | `0 1px 2px rgba(29,26,23,.04), 0 8px 24px rgba(29,26,23,.06)` | `0 1px 2px rgba(0,0,0,.2), 0 8px 24px rgba(0,0,0,.3)` |
| `--shadow-lg` | `0 2px 4px rgba(29,26,23,.05), 0 16px 48px rgba(29,26,23,.10)` | `0 2px 4px rgba(0,0,0,.25), 0 16px 48px rgba(0,0,0,.45)` |

Default accent is the terracotta `#D9532F` family (the oklch values above). The prototype offered
alternates (`#2A6FDB` blue, `#1F8A5B` green, `#7048C8` purple) — terracotta is the shipped brand.
Warm paper-like neutrals; **never pure gray/black.**

## 4. Layout & chrome

- Content widths: **1120px** (header, home, footer) · **760px** (tool pages). Page gutter 20px.
- **Header:** sticky, 60px, translucent bg (`color-mix` 88% bg) + `backdrop-filter: blur(12px)`,
  1px bottom hairline. Left: wordmark → home. Right: theme toggle pill (dot + "Dark"/"Light").
- **Footer:** surface bg, top hairline. Brand blurb (max 280px) + auto-fit columns
  (minmax 150px) of tool links by category — the SEO sitemap-style nav. Legal line below a
  hairline.
- Radii: cards/dropzone **16–20px**, inner rows/inputs **12–14px**, pills/chips **999px**,
  file thumb 6px.
- Cards: `--surface` bg + 1px `--line` border + `--shadow`; hover (tool cards):
  `translateY(-2px)`, `--shadow-lg`, accent border.

## 5. Homepage anatomy

1. Hero (centered, 64px top pad): H1 → Hinglish serif line → muted subline → trust chips row.
2. **Search** (max 480px): 16px radius, magnifier icon, placeholder *'Search tools… try
   "compress"'* — filters the grid **live** across name+description+category; no-results copy:
   *'No tools found for "{q}". Try "merge", "compress", "resize"…'*
3. Tool sections: `PDF Tools` — sub *"Merge, split, compress, sign — sab kuch, right in your
   browser."*; `Image Tools` — sub *"Compress, resize and convert images without uploading them
   anywhere."* Groups within a section (uppercase micro-labels): Organize · Convert ·
   Optimize & Security · Annotate & Edit · All image tools.
4. Tool card: 40px rounded icon tile (`--accent-soft` bg, accent stroke icon) + name (15px, 600)
   + one-line muted description. Grid `repeat(auto-fill, minmax(min(100%, 240px), 1fr))`, 12px gap.

## 6. Tool page anatomy (the ToolShell)

Back link ("‹ All tools") → 52px icon tile + serif H1 + muted tagline → small trust-signal row →
then a **four-phase flow** (only one phase visible at a time):

### Phase: `empty` — dropzone
2px dashed border, 20px radius, 56px padding, centered. 64px accent square with up-arrow
(white icon, `--shadow-lg`). Title "Drop your file(s) here" (18px/600), subline
"or tap to browse · {accept hint}". Drag-over: border + bg flip to accent/accent-soft.
Underlined link: *"No file handy? Try a sample"* (loads bundled sample files).

### Phase: `ready` — files + options + action
- **Files card:** uppercase count label ("2 files") + "+ Add more". Multi-file tools show
  *"Drag to reorder — files merge top to bottom."*, a grab handle, an accent number badge, and
  up/down buttons per row. Every row: doc thumbnail, name (truncated), size, remove ✕.
  Dragged row highlights accent border + soft bg.
- **Options card** (only if the tool has options) — controls rendered from the options schema:
  - *slider*: label left, live value right in accent (e.g. "75%", or mapped labels like
    Light/Balanced/Strong), `accent-color` range input.
  - *number*: input (max 200px) + unit suffix (KB/px/mm).
  - *text/password*: full-width, 12px radius, focus ring = accent border.
  - *choice*: pill buttons; selected = accent bg + accent-ink text.
  - optional muted hint line (12.5px) under any control.
- **Action button:** full-width, accent, 17px/600, "{Verb} Karo →". Hover lifts 1px +
  brightness 1.06.

### Phase: `processing`
Centered card: serif italic accent *"Ho raha hai…"* pulsing (`ck-pulse`), muted note
"Working locally on your device — nothing is uploaded.", 8px progress bar (accent on
`--surface2`, 360px max) + bold percent below. **Progress is real** (worker events), not
simulated.

### Phase: `done`
72px accent circle, checkmark **draws itself** (`ck-pop` scale-in + `ck-draw` stroke-dash).
Serif *"Ho gaya!"* (30px) + note "{n files processed | Your file is ready} — entirely on your
device." Output chip: doc icon + filename + size on `--surface2`. Buttons: accent
**↓ Download** + outlined **Start over**. Muted reassurance line at the bottom.

### Ad slot
Below the tool area, only on tool pages: 10px uppercase "Advertisement" caption + 90px
placeholder (hairline border, diagonal-stripe bg, `728×90 / responsive`) — wired to AdSense later.

## 7. Motion

| Keyframes | Use |
|---|---|
| `ck-rise` — fade + 10px rise, 0.25–0.3s ease | ready/done cards entering |
| `ck-pop` — scale 0.4→1.08→1, 0.45s `cubic-bezier(0.2,1.4,0.4,1)` | success circle |
| `ck-draw` — stroke-dashoffset 48→0, 0.5s, 0.25s delay | checkmark stroke |
| `ck-pulse` — opacity 1→0.55→1, 1.4s infinite | "Ho raha hai…" |

Micro-transitions 0.12–0.15s ease on hover/drag states. Respect `prefers-reduced-motion` in
implementation (not in the prototype — add it).

## 8. Iconography

Inline SVG, 24px viewBox, `stroke="currentColor"`, stroke-width 1.8 (2 for chrome icons), round
caps/joins, no fills. The prototype defines a ~22-glyph set (merge, split, compress, rotate, crop,
pages, extract, del, img, doc, text, create, annotate, watermark, hash, hf, lock, unlock, sign,
resize, convert, exif, flip) — port as a typed `Icon` component keyed by the same names.

## 9. Output naming (from prototype logic)

`merged.pdf` · `{base}-split.zip` · `{base}-compressed.pdf` · `images.pdf` · `{base}-pages.zip` ·
`{base}.txt` · `{base}.webp` · `{base}-compressed.jpg` · `{base}-resized.png` · `{base}.{fmt}` ·
`{base}-clean.jpg` · `{title}.pdf` · fallback `{base}-{verb}d.pdf`. Done-state size shows real
before/after where compression is involved.

## 10. Accessibility notes (implementation must-dos)

The prototype is divs-and-inline-styles; the build must upgrade it: semantic landmarks
(`header/main/footer/nav`), real `<button>`/`<a href>` (tool cards are links, not onClick),
labels bound to inputs, focus-visible rings (accent), dropzone keyboard-operable
(Enter/Space opens picker), file rows reorderable via keyboard (dnd-kit sensors), progress as
`role="progressbar"` with `aria-valuenow`, status changes announced via `aria-live`, WCAG AA
contrast in both themes.
