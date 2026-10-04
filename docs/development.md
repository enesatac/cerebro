# Cerebro — Development Guide

## Requirements

- Node.js ≥ 22.12 (tested on 22.18). Some newest majors (React Router 8, jsdom 30) need ≥ 22.22;
  the project pins React Router 7 and jsdom 29 until the Node baseline moves.
- npm 10+; JDK 21 for the backend (Maven comes with the wrapper); Docker only for a local Oracle.

## Setup and commands

Web app (`frontend/`):

```bash
npm install
npm run dev          # http://localhost:5173, demo data in the browser
npm run dev:api      # the same against the API on :8080 (proxied /api)
npm run typecheck    # tsc -b
npm run lint         # eslint (strict typescript-eslint + react-hooks)
npm run test         # vitest run
npm run build        # typecheck + production build (demo data)
npm run build:api    # production build for the API → dist/, packed into the jar
npm run validate     # typecheck → lint → test → build
npm run format       # prettier --write
npm run generate:backend-seed   # backend V2/V3 migrations + demo data from the frontend sources
```

API (`backend/`):

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2      # no database server (H2, Oracle mode)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # Oracle Free: docker compose up -d
./mvnw verify                                             # unit + API integration tests
./mvnw package                                            # target/cerebro.jar (+ frontend/dist)
```

`npm run validate` must pass before any change is considered complete; when the backend or a
repository contract changed, `./mvnw verify` and the contract test must pass too.

## Working against the API

`npm run dev:api` uses the HTTP repositories (`.env.api`) and proxies `/api` to the API on port 8080. Changing a repository contract means changing four places together, in one change: the
contract (`domains/<d>/api`), the mock (`services/mock`), the HTTP implementation
(`services/http`) and the API (`backend/`). Prove they agree with the contract test against a
freshly started API (empty database, demo data loaded on start):

```bash
java -jar ../backend/target/cerebro.jar --spring.profiles.active=h2 &
CEREBRO_API_URL=http://localhost:8080 npx vitest run src/services/http/apiContract.test.ts
```

It runs every read and a write scenario on both implementations and compares the results, so run
it on a fresh database (it writes; restart the `h2` API to reset it).

Changing the demo organisation or master data in `src/services/mock/data/`: run
`npm run generate:backend-seed` so the backend loads the same data. V2/V3 are migrations — once
released, ship master data changes as a new migration instead.

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
- `Table` pagination text ("Page 1 of 2", "Items 1-10 of 17") and its aria-labels are
  hard-coded in English by Takeoff; they are left as the library renders them.
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
