# Cerebro

Internal enterprise platform that acts as the **single source of truth for projects and
applications**: what they are, who owns them, what they depend on, what they run on, and which
risks, escalations and decisions surround them.

Think application/project portfolio management + internal developer portal + architecture
catalogue — kept simple.

**One repository, one deployable.** The web app (`frontend/`) is built into the Spring Boot jar
(`backend/`), which serves it and the REST API from one origin, on Oracle. One container image,
one Helm release on OpenShift, one Jenkins pipeline.

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
- **Production releases** — `/releases`: every application's and project's go-lives on one
  horizontal calendar (2 weeks / month / 3 months, rows by application or by project), coloured by
  status; release number, title, version, window (past midnight too), owner, service
  interruption, details, rollback plan and outcome; releases past their day without an outcome are
  flagged; list view with filters and Excel export. Each application and project has a "Canlı
  geçişler" tab with "Geçiş ekle" pre-filled; editors can also add from a free calendar day.
- **Procurement tracker** — `/procurement`: where every purchase stands — ordered steps (need,
  market research, RFQ, evaluation, negotiation, approval, PO, signing, delivery, acceptance,
  invoicing; administrable) with owners and planned against actual dates, delays, the current step
  and a log of notes (internal notes for the procurement team only); dashboard with late and
  upcoming steps, filters and Excel export. Business units get it read-only (`procurement:view`),
  opening on their own unit and without amounts.
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

| Part     | Technology                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------- |
| Web app  | React 19 · TypeScript 6 · Vite 8 · React Router 7 · TanStack Query 5 · RHF + Zod · Takeoff UI v2  |
| API      | Java 21 · Spring Boot 4 (MVC, Security, OAuth2 client, JDBC, Spring Session) · Flyway · springdoc |
| Database | Oracle Database 19c or later (H2 in Oracle mode for tests and quick local runs)                   |
| SSO      | Oracle Access Manager over OpenID Connect                                                         |
| Delivery | Jenkins (`Jenkinsfile`) → OpenShift build → Nexus → Helm (`deploy/helm/cerebro`) on OpenShift     |

## Repository layout

```
frontend/   web app (React + Vite); `npm run build:api` → frontend/dist
backend/    Spring Boot API; packs frontend/dist into target/cerebro.jar and serves it
deploy/     Helm chart (values per environment) and the OpenShift BuildConfig
docs/       architecture, backend, deployment, domain model, development guide, decisions
Dockerfile  runtime image for target/cerebro.jar (UBI OpenJDK 21)
Jenkinsfile build → test → contract → image → dev → test → prod
docker-compose.yml  Oracle Database Free for local development
```

## Getting started

Requirements: Node.js ≥ 22.12 and npm 10+ (web app), JDK 21 (API). Docker only for a local Oracle.

**1. Web app alone, demo data in the browser** (no backend):

```bash
cd frontend && npm install && npm run dev            # http://localhost:5173
```

**2. Web app on the API, no database server** (H2 in Oracle mode, demo data loaded on start):

```bash
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
cd frontend && npm run dev:api                       # http://localhost:5173, /api → :8080
```

**3. On Oracle** (Oracle Database Free in Docker):

```bash
docker compose up -d                                 # wait until healthy (~1 min)
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
cd frontend && npm run dev:api
```

**4. The deployable itself** — one jar serving the web app and the API:

```bash
cd frontend && npm run build:api
cd ../backend && ./mvnw package
java -jar target/cerebro.jar --spring.profiles.active=h2   # http://localhost:8080
```

Sign in with one of the demo accounts (account picker, no password — local and `h2` only):

| Account       | Roles                                  |
| ------------- | -------------------------------------- |
| Can Öztürk    | Sistem yöneticisi                      |
| Selin Aydın   | Sistem yöneticisi                      |
| Zeynep Çelik  | Portföy ofisi                          |
| Tom Brennan   | Birim / ekip yöneticisi                |
| Elif Kaya     | İş birimi kullanıcısı, Çalışan         |
| Nadia Petrova | Çalışan — deactivated (cannot sign in) |

The demo organisation is fictional (`frontend/src/services/mock/data/`); the backend loads the
same data, generated with `npm run generate:backend-seed`. In the browser-only mode, changes are
kept in `localStorage`; clear the site data to reset.

## Checks

```bash
cd frontend && npm run validate     # typecheck → lint → tests → build
cd backend && ./mvnw verify         # unit tests + API integration test (H2 Oracle mode, or Oracle)
```

The contract test proves that the web app's in-browser backend and the real API answer every call
the same way (run against a freshly started API, see [Development](docs/development.md)). Jenkins
runs all three on every build; GitHub Actions runs them on pushes and pull requests.

## Deployment

Jenkins builds and tests, OpenShift builds the image and pushes it to Nexus, Helm deploys the same
image to dev, then — after approval — to test and production. Configuration per environment is in
`deploy/helm/cerebro/values-<env>.yaml`; secrets (database, OIDC client) are OpenShift Secrets.
Setup checklist: [Deployment](docs/deployment.md).

## Documentation

- [Architecture](docs/architecture.md) · [Backend](docs/backend.md) ·
  [Deployment](docs/deployment.md)
- [Domain model](docs/domain-model.md) · [Development guide](docs/development.md) ·
  [Roadmap](docs/roadmap.md) · [Decisions](docs/decisions.md)
- Database schema: `backend/src/main/resources/db/migration/` (Flyway, Oracle)
- API: `/v3/api-docs` and `/swagger-ui.html` (not in production)
- [`CLAUDE.md`](CLAUDE.md) / [`frontend/AGENTS.md`](frontend/AGENTS.md) — guidance for AI coding
  agents; `.claude/skills/` — project skills

## Security

Cerebro records must never contain secrets — passwords, tokens, API keys or connection strings.
Forms reject values that look like secrets, and documentation links must be `http(s)` URLs.
