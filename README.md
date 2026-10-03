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
- **Person pages** — click any person (team members, owners, stakeholders) to see everything they
  are mapped to on one screen: applications and projects (own role or via team), escalations,
  risks, decisions, teams and upcoming leaves.
- **Files on records** — applications, projects, teams, technologies, risks, escalations and
  decisions hold documents (Takeoff `Upload`: drag & drop, several at once, progress, refusal
  reasons). Applications and projects show a required-documents checklist (e.g. architecture,
  security assessment, operations guide; charter, requirements, test report, go-live approval);
  everything else is reference material with a type and description. PDFs and images open in a
  new tab, other files download. Only document, image, diagram and archive types up to 20 MB.
- **Excel export everywhere** — every table (lists, registers, detail tabs, reports, chart tables,
  master data) has "Excel'e aktar": a formatted .xlsx with a title and filter/context line,
  styled frozen header, auto-filter, fitted columns, real dates/numbers/percentages and clickable
  links. Paged lists export all matching records; pages with several tables export one sheet per
  table (e.g. a person's work summary).
- **Report charts** — `/reports`: portfolio (active projects per month with the planned outlook,
  milestones, projects/applications by status, lifecycle, criticality, business unit, top
  technologies), operations (escalations raised per month by severity, open backlog, median
  time to resolve, active risk matrix, risks and decisions per month) and resources (planned
  FTE per project, over-allocated people, leave days). Period presets, every chart has a table
  view, hover/keyboard tooltips and drill-down links.
- **Incident runbooks** — every application has a "Sorun anında" tab: first-response checklist,
  addresses to check (dashboards, logs, health checks — with what to look for), whom to call in
  escalation order, and searchable known problems with resolution steps. Never credentials.
- **Resource plan** — `/resources`: who works on which project, when and at what share of their
  time. Parallel allocations stack into lanes, a daily load strip turns red above 100 %, leaves
  are shaded in. Zoom from a month to a year; admins plan allocations with a live load preview.
- **Purchases and contracts** — `/contracts` and each project's "Satın alma" tab: what was
  bought for a project, from which vendor, for how long and at what value; payment plan with
  invoices and payment dates; notice deadlines, auto-renewal and overdue payments flagged; signed
  contract as a required document; vendors register; Excel export. Visible only with the
  `contracts` privilege.
- **Demands** — `/demands`: business units raise project, application and change requests with
  every detail (need, benefits, urgency, date, budget, related systems, files) and follow them;
  `/demands/manage` (portfolio office): triage inbox, WSJF scoring with a suggested priority,
  a ranked backlog and a quarter roadmap to schedule approved demands. Decisions, questions to
  the requester and every status change are visible on the demand.
- **Leave calendar** — `/leaves`: people down the side, days across the top, each leave a bar in
  its type's colour (2 weeks / month / 3 months, filters, list view). Admins add, edit and delete
  leaves; overlapping leaves for the same person are rejected.
- **Roles and privileges** — `/admin/roles`: every screen has view, edit and delete privileges;
  roles bundle them (screen-by-screen matrix editor) and users hold one or more roles. A privilege
  matrix (screens × roles) and catalogue show who may do what. Seed roles: Sistem yöneticisi,
  Portföy ofisi, Birim / ekip yöneticisi, İş birimi kullanıcısı, Çalışan, Denetçi. Enforced in the
  repository layer and mirrored in navigation, routes and buttons. Permissions are
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

| Account       | Roles                                  |
| ------------- | -------------------------------------- |
| Can Öztürk    | Sistem yöneticisi                      |
| Selin Aydın   | Sistem yöneticisi                      |
| Zeynep Çelik  | Portföy ofisi                          |
| Tom Brennan   | Birim / ekip yöneticisi                |
| Elif Kaya     | İş birimi kullanıcısı, Çalışan         |
| Nadia Petrova | Çalışan — deactivated (cannot sign in) |

### Demo data

Seed data lives in `src/services/mock/data/` and is entirely fictional. In development, changes
are persisted to `localStorage` (`cerebro.demo-db.v9`, session in `cerebro.demo-session.v2`). Clear
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
  lib/          framework-agnostic helpers (dates, errors, validation, search, xlsx)
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
