# Cerebro

Internal enterprise platform that is the single source of truth for **projects and
applications**: what they are, who owns them, what they depend on, what they run on,
and what risks, escalations and decisions surround them. Think application/project
portfolio management + internal developer portal + architecture catalog — kept simple.

One repository, one deployable: `frontend/` (the web app) is built into the `backend/` jar, which
serves it and the REST API from one origin; one container image, one Helm release on OpenShift,
one Jenkins pipeline.

## Stack

**Frontend (`frontend/`)**: React 19 · TypeScript 6 (strict) · Vite 8 · React Router 7 · TanStack
Query 5 · React Hook Form + Zod 4 · date-fns 4 · Vitest + Testing Library · ESLint 10 + Prettier.

**Backend (`backend/`)**: Java 21 · Spring Boot 4 (Web MVC, Security, OAuth2 client, JDBC, Spring
Session JDBC) · **Oracle Database 19c+** · Flyway · JUnit 5 (H2 in Oracle mode, Oracle XE via
Testcontainers) · Maven wrapper.

**Delivery**: `Dockerfile` (UBI OpenJDK 21 runtime) · `deploy/helm/cerebro` · `Jenkinsfile` ·
Nexus (images, npm, Maven) · SSO: Oracle Access Manager over OIDC.

Design system: **Takeoff UI v2** — `@takeoff-ui/react-spar` (compound React API),
`@takeoff-design/tokens` (CSS variables + component recipes), `@takeoff-icons/react`.

## Important paths

Frontend paths below are relative to `frontend/` (so are the paths in `.claude/skills`).

| Path                    | Purpose                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/`              | Composition root: providers, router, route paths, app shell                                                   |
| `src/components/`       | Cross-domain presentational building blocks (layout, feedback, data display)                                  |
| `src/domains/<domain>/` | Domain modules: `types`, `api` (repository contract + query hooks), `components`, `pages`, `utils`, `schemas` |
| `src/domains/shared/`   | Shared domain primitives (ids, audit metadata, refs, documentation links, paging)                             |
| `src/services/`         | Repository registry + implementations: `http/` (Cerebro API) and `mock/` (demo, tests)                        |
| `src/lib/`              | Framework-agnostic helpers (dates, errors, query client)                                                      |
| `src/test/`             | Test setup and `renderRoute` (real routes + in-memory repositories)                                           |
| `scripts/`              | `backend-seed.gen.ts`: generates the backend's seed migrations and demo data from the frontend sources        |
| `AGENTS.md`             | Official Takeoff UI component index + house rules (from the installed package)                                |
| `../backend/`           | Spring Boot API: one package per domain under `com.cerebro.api`, Flyway migrations in `db/migration`          |
| `../deploy/`            | Helm chart (`helm/cerebro`, values per environment) and the OpenShift BuildConfig                             |
| `../docs/`              | `architecture.md`, `backend.md`, `deployment.md`, `domain-model.md`, `development.md`, `decisions.md`         |

## Architecture principles

- **Dependency direction:** `app → domains → components/lib`, and `domains → services` only via
  the repository context. UI never imports mock data; ESLint enforces this.
- **Repository boundary:** every entity is read/written through a typed repository interface
  (`domains/*/api/*Repository.ts`), implemented twice: `services/http` over the Cerebro API
  (`backend/`) and `services/mock` (demo, tests). A contract change updates the interface, both
  implementations and the API together in one change; prove parity with
  `src/services/http/apiContract.test.ts` (`CEREBRO_API_URL`, freshly started API on `h2`).
- **Database:** Oracle 19c+. Schema changes are new Flyway migrations (`backend/.../db/migration`,
  never edit an applied one); 19c syntax only (no BOOLEAN columns, no `IF NOT EXISTS`, no
  multi-row `VALUES`); booleans NUMBER(1), string lists JSON in CLOB, `''` is NULL (read back
  with `Sql.text`). New rows leave `id` to the identity (`Sql.insert`, `ChildRows`).
- **Server state = TanStack Query.** Local state first; narrow React Context second; no Redux.
- **Explicit relationships:** reference entities by id (`teamId`, `personId`), never by name strings.
  Roles are contextual (`RoleAssignment` on an application/project), not global person attributes.
- **Master data:** every enumerated value (status, lifecycle, criticality, types, categories…) is
  administrable at `/admin/master-data`. Render with `MasterBadge`/`MasterLabel`, offer with
  `MasterSelectField` or `useMasterData().options()`. Never hard-code a label, colour or option list.
  Codes the logic depends on are `systemCodes` in `domains/master-data/catalog.ts`.
- **Dates** are ISO-8601 strings in the domain; format only through `src/lib/dates.ts`.
- **No secrets** (passwords, tokens, keys, connection strings) in any Cerebro record or mock.

## Takeoff UI rules (non-negotiable)

1. Takeoff UI is the design system. Use its component before writing any custom UI.
2. **MCP-first:** look up the component with the `takeoff-ui-mcp` server
   (`get-components-list`, `get-components-info`) before using it. If MCP is unavailable, use the
   installed package: `node_modules/@takeoff-ui/react-spar/dist/index.d.ts` (authoritative types)
   and the version-matched docs (`https://takeoff-v2.app.turkishtechlab.com/docs/components/<name>.md`).
3. Never invent component names, props, variants or events. `npm run typecheck` must prove usage.
4. Custom CSS is only for layout/composition and gaps Takeoff does not cover, and it uses Takeoff
   tokens (`--spacing-*`, `--text-*`, `--border-*`, `--background-*`, `--radius-*`, `--size-*`).

## Validation commands

```bash
cd frontend && npm run validate        # typecheck → lint → test → build
cd backend && ./mvnw verify            # unit + API integration test (H2 Oracle mode / Oracle)
# Contract (mock = API), after `npm run build:api` and `./mvnw package`:
java -jar backend/target/cerebro.jar --spring.profiles.active=h2 &
cd frontend && CEREBRO_API_URL=http://localhost:8080 npx vitest run src/services/http/apiContract.test.ts
```

A task is not complete until `npm run validate` passes, and — when the backend or a repository
contract changed — `./mvnw verify` and the contract test pass too.

## Roles & forms

- Access: per-screen privileges `<module>:<view|edit|delete>` (`PRIVILEGE_MODULES` in
  `domains/auth/types`), bundled into administrable roles; users hold several roles. Enforce in the
  repository (`WriteKit.begin('<module>:edit')`), guard routes with `guarded(page, privilege)` and
  mirror in the UI with `Can`, `CreateAction`/`EditAction` (`privilege` prop), `RequirePrivilege`.
  A new screen gets its own module in the catalogue.
- Forms: `FormPage` + fields from `components/forms`; schema and mappers in
  `domains/<d>/schemas/*Form.ts`; mutations via `useRepositoryMutation`.
- Deletion: every editable record has a `domains/<d>/components/<Entity>DeleteAction` (permission
  guard + impact confirmation). Offer it on the edit form, the detail page header and list rows
  (`editColumn(to, describe, renderDelete)`, `compact`). Users cannot delete themselves or the last system administrator.

## Conventions

- **UI language is Turkish** (labels, messages, validation, toasts, mock data); code, comments and
  docs are English. Format dates/numbers only via `lib/dates.ts` / `lib/format.ts` (Turkish locale).

- Files: `PascalCase.tsx` for components, `camelCase.ts` for modules; one component per file.
- Routes: always build URLs via `src/app/router/paths.ts` helpers — no string literals.
- IDs: every table row has a numeric primary key from its own sequence (`EntityId = number`),
  assigned by the server; new child rows are sent with `id: null` (`Draft<T>`). Never array indices.
  Seed/test code refers to seed rows by name (`APP.paymentGateway` in `services/mock/data/ids.ts`).
  Schema: `backend/src/main/resources/db/migration/`.
- Every async view has loading, empty and error states (`components/feedback`).
- Tests next to code as `*.test.ts(x)`; prioritise domain logic, schemas, filters, flows.
- Record significant architectural decisions in `docs/decisions.md`.

## Project Skills (`.claude/skills/`)

| Skill                         | Use when                                                  |
| ----------------------------- | --------------------------------------------------------- |
| `cerebro-architecture`        | new module/service, directory changes, major features     |
| `takeoff-ui-development`      | any UI work                                               |
| `cerebro-feature-development` | implementing any feature end-to-end                       |
| `cerebro-domain-model`        | touching entities, relationships, mock data, repositories |
| `cerebro-code-quality`        | before completing any task                                |
| `cerebro-review`              | reviewing a change set                                    |
