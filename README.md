# CompressKaro

Free, fully client-side PDF & image tools — **your files never leave your device**. No backend,
no uploads, no signup. Everything runs in your browser, deployed as a static site.

> *Compress karo. Merge karo. Done.*

## Quick start (no host Node/pnpm needed)

```bash
bin/setup      # one-time: Colima profile + dev image + lockfile
bin/dev        # dev server → http://localhost:4321 (Ctrl-C tears down)
bin/test       # vitest suite
bin/lint       # eslint + typecheck
```

Requires Docker CLI + Colima on macOS. Everything runs inside a dedicated `compresskaro`
Colima profile. *(Note: `bin/setup` becomes runnable once the Phase 0 scaffold lands — see
[docs/Progress.md](docs/Progress.md).)*

## Docs

| Doc | What it covers |
|---|---|
| [docs/specifications.md](docs/specifications.md) | Product spec (what we're building) |
| [docs/Architecture.md](docs/Architecture.md) | Stack, repo structure, dev/CI/deploy, **phased build plan** |
| [docs/Design-System.md](docs/Design-System.md) | Tokens, typography, components, Hinglish voice |
| [docs/Tool-Catalog.md](docs/Tool-Catalog.md) | All 31 tools: slugs, options, outputs, phases |
| [docs/Progress.md](docs/Progress.md) | Decisions log + phase tracker |

## Deploy

Pushes to `main` build the static site and publish to GitHub Pages
(`.github/workflows/deploy.yml`). CI runs lint + typecheck + test + build on every PR.
