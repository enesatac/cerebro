# Cerebro

Internal enterprise platform that acts as the **single source of truth for projects and
applications**: what they are, who owns them, what they depend on, what they run on, and which
risks, escalations and decisions surround them.

Think application/project portfolio management + internal developer portal + architecture
catalogue — kept simple.

> **Status:** MVP running on an in-browser mock backend. No real backend or SSO yet — see
> [Roadmap](docs/roadmap.md).

## Features

- **Applications & projects** — searchable, filterable, sortable lists with URL state; rich detail
  pages (ownership, technologies, environments, dependencies, milestones, documentation, history).
- **Dashboard** — portfolio overview, "needs attention" rules, recently updated records, upcoming
  milestones, lifecycle distribution.
- **Organisational context** — teams, people, business units, technology catalogue with where-used
  and deprecated-technology reporting.
- **Operational knowledge** — risks, escalations and decision (ADR) registers linked to
  applications and projects.
- **Connections** — dependencies and integrations with impact analysis ("what breaks if X is
  down").
- **Governance** — completeness scoring, review staleness, ownership gaps, audit history.
- **Create / edit forms for every entity** — validation summary, server-side field errors,
  unsaved-changes guard, and a deletion-impact confirmation before destructive actions.
- **Master data** — one admin page for every value offered in forms and shown as a label or badge
  (statuses, types, categories, scales…), plus business units and people. Changes apply site-wide.
- **Leave calendar** — `/leaves`: people down the side, days across the top, each leave a bar in
  its type's colour (2 weeks / month / 3 months, filters, list view). Admins add, edit and delete
  leaves; overlapping leaves for the same person are rejected.
- **Roles** — `admin` (full access, user and master data management) and `user` (read-only). Permissions are
  enforced in the repository layer and mirrored in the UI.

## Tech stack

React 19 · TypeScript 6 (strict) · Vite 8 · React Router 7 · TanStack Query 5 · React Hook Form +
Zod 4 · date-fns 4 · Vitest + Testing Library · ESLint + Prettier

Design system: **Takeoff UI v2** — `@takeoff-ui/react-spar`, `@takeoff-design/tokens`,
`@takeoff-icons/react`.

## Getting started

Requirements: **Node.js ≥ 22.12** (see `.nvmrc`) and npm 10+.

```bash
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with one of the demo accounts (no password — account
picker only):

| Account       | Role                         |
| ------------- | ---------------------------- |
| Can Öztürk    | Admin                        |
| Selin Aydın   | Admin                        |
| Elif Kaya     | User (read-only)             |
| Tom Brennan   | User (read-only)             |
| Nadia Petrova | Deactivated (cannot sign in) |

### Demo data

Seed data lives in `src/services/mock/data/` and is entirely fictional. In development, changes
are persisted to `localStorage` (`cerebro.demo-db.v5`, session in `cerebro.demo-session.v2`). Clear
those keys (or the site data) to reset to the seed.

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the dev server                |
| `npm run build`     | Type-check and build for production |
| `npm run preview`   | Preview the production build        |
| `npm run typecheck` | TypeScript project check            |
| `npm run lint`      | ESLint                              |
| `npm run test`      | Vitest (single run)                 |
| `npm run format`    | Prettier (write)                    |
| `npm run validate`  | typecheck → lint → test → build     |

A change is complete only when `npm run validate` passes. CI runs the same checks on every push
and pull request.

## Project structure

```
src/
  app/          composition root: providers, router, route paths, app shell
  components/   cross-domain building blocks (layout, forms, feedback, data display)
  domains/      one folder per domain: types, api, schemas, utils, components, pages
  services/     repository registry + implementations (mock/ today, http/ later)
  lib/          framework-agnostic helpers (dates, errors, validation, csv)
  hooks/        shared React hooks
  test/         test setup and route-level render helpers
docs/           architecture, domain model, development guide, roadmap, decisions
```

Dependency direction is `app → domains → components/lib`; domains reach services only through the
repository context (enforced by ESLint).

## Documentation

- [Architecture](docs/architecture.md)
- [Domain model](docs/domain-model.md)
- [Development guide](docs/development.md)
- [Roadmap](docs/roadmap.md)
- [Architecture decisions](docs/decisions.md)
- [Database schema (PostgreSQL)](docs/database-schema.sql)
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — guidance for AI coding agents
- `.claude/skills/` — project skills (architecture, Takeoff UI, features, domain model, quality,
  review)

## Security

Cerebro records must never contain secrets — passwords, tokens, API keys or connection strings.
Forms reject values that look like secrets, and documentation links must be `http(s)` URLs.
