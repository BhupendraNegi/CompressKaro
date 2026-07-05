# CLAUDE.md
**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Conventions

- **Git commits:** Do NOT add Claude as a co-author. No `Co-Authored-By: Claude` trailer and no "Generated with Claude Code" line in commit messages. Never.

## Project Setup (CompressKaro)

See [docs/Architecture.md](docs/Architecture.md) for the full plan; [docs/specifications.md](docs/specifications.md) for the product spec; [docs/Design-System.md](docs/Design-System.md) for visual/copy rules; [docs/Tool-Catalog.md](docs/Tool-Catalog.md) for the 30-tool inventory; [docs/Progress.md](docs/Progress.md) for phase status.

- **What it is:** a 100% client-side PDF & image tool suite. Core promise: "Your files never leave your device." No backend, no uploads, no auth — ever.
- **Stack:** Astro (static output) + React islands + TypeScript, Tailwind CSS (class-strategy dark mode), pnpm, Node 22 (in Docker). PDF: pdf-lib / pdfjs-dist / jsPDF. Images: browser-image-compression + Canvas. Zip: fflate. Reorder: dnd-kit.
- **Core rules:** (1) every tool = one `config.ts` + one `process.ts` in `src/tools/<id>/`, registered in `src/tools/registry.ts` — pages, grid, footer, sitemap all derive from the registry; (2) `src/lib/` + `process.ts` are pure TS (no React), run inside Web Workers with real progress events; (3) all tools render through the single ToolShell island (empty → ready → processing → done).
- **Voice:** Hinglish by default — "Merge Karo →", "Ho raha hai…", "Ho gaya!". Copy stays centralized.
- **Tests:** Vitest for the core/processing fns; Playwright for upload→process→download e2e per tool.
- **Deploy:** GitHub Pages via `.github/workflows/deploy.yml` (`PAGES=true` → `base: /CompressKaro` → publish `dist/` + `.nojekyll`). CI (`ci.yml`) runs lint + typecheck + test + build on every PR/main push (pnpm on the runner, no Docker).
- **Local dev:** Colima profile `compresskaro`, develop inside Docker. Use the `bin/` scripts (no host Node/pnpm needed): `bin/setup` (one-time), `bin/dev` (server on `localhost:4321`, free-port fallback, teardown on exit), `bin/test`, `bin/lint`. Hot reload uses polling (`CHOKIDAR_USEPOLLING`). After any `package.json` dep change, regenerate the lockfile with `docker compose run --rm web pnpm install --lockfile-only` — never extract it from the image.
