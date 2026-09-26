# Cerebro — Development Guide

## Requirements

- Node.js ≥ 22.12 (tested on 22.18). Some newest majors (React Router 8, jsdom 30) need ≥ 22.22;
  the project pins React Router 7 and jsdom 29 until the Node baseline moves.
- npm 10+

## Setup and commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc -b
npm run lint         # eslint (strict typescript-eslint + react-hooks)
npm run test         # vitest run
npm run build        # typecheck + production build
npm run validate     # typecheck → lint → test → build
npm run format       # prettier --write
```

`npm run validate` must pass before any change is considered complete.

## Takeoff UI

- Package: `@takeoff-ui/react-spar` **0.6.0** (Takeoff v2, React 19 only) with
  `@takeoff-design/tokens` (peer) and `@takeoff-icons/react`.
- Token CSS is imported once in `src/main.tsx`; `TakeoffSparProvider` is mounted in
  `app/providers/AppProviders.tsx`.
- Component index and house rules: `AGENTS.md` (generated from the package's official template).

### Verifying a component API (mandatory, in order)

1. **Takeoff UI MCP** (`takeoff-ui-mcp`): `get-components-list`, `get-components-info`.
2. **Installed types**: `node_modules/@takeoff-ui/react-spar/dist/index.d.ts`.
3. **Version docs**: `https://takeoff-v2.app.turkishtechlab.com/docs/components/<name>.md`
   (full corpus: `/llms-full.txt`).

The installed types are authoritative. `npm run typecheck` is the final proof that props exist.

### Known Takeoff behaviours

- `Button as={Link}` renders `role="button"` on the anchor. Use `components/actions/ButtonLink`,
  which restores the link role.
- `Select` has no clearable empty value; `components/forms/FilterSelect` adds an explicit
  "All …" option.
- `Table` sets widths per column but uses `table-layout: auto`; keep the sum of column widths
  within the container width.

## Conventions

- Structure and dependency rules: `.claude/skills/cerebro-architecture/SKILL.md`.
- Domain rules: `.claude/skills/cerebro-domain-model/SKILL.md`, `docs/domain-model.md`.
- Feature workflow: `.claude/skills/cerebro-feature-development/SKILL.md`.
- Routes via `app/router/paths.ts`; dates via `lib/dates.ts`; numbers via `lib/format.ts`.
- CSS classes use the `c-` prefix and Takeoff tokens only.

## Mock data

Seed data lives in `src/services/mock/data/`. It is fictional (hosts use the reserved `.example`
TLD) and intentionally contains data-quality gaps (a missing technical owner, stale reviews) to
exercise governance features. `integrity.test.ts` verifies all references resolve and that no
credential-like data is present. Simulated latency is 250 ms in development and 0 in tests.

## Claude Code

Project instructions: `CLAUDE.md`. Skills in `.claude/skills/`. Dev server launch config for the
preview browser: `.claude/launch.json`.
