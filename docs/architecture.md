# Cerebro — Architecture

Cerebro is a React single-page application. All data flows through typed repository interfaces
with two implementations: the Cerebro API (separate repository **cerebro-api**, Spring Boot +
PostgreSQL) over HTTP, and an in-memory mock used for the demo, development without a backend and
tests. Both satisfy the same contracts; a contract test proves they behave the same.

## Layers

```text
┌──────────────────────────────────────────────────────────────┐
│ app/          composition root: providers, router, shell     │
├──────────────────────────────────────────────────────────────┤
│ domains/<d>/pages        route components (lazy-loaded)      │
│ domains/<d>/components   domain UI                           │
│ domains/<d>/api          repository contract + query hooks   │
│ domains/<d>/utils        pure logic (presentation, filters)  │
│ domains/<d>/types        entities, value objects, read models│
├──────────────────────────────────────────────────────────────┤
│ components/   domain-agnostic UI (PageHeader, DetailList, …) │
│ lib/          framework-agnostic helpers (dates, errors, …)  │
├──────────────────────────────────────────────────────────────┤
│ services/     Repositories aggregate + RepositoryContext     │
│ services/http REST implementation over the Cerebro API       │
│ services/mock in-memory implementation + seed data           │
└──────────────────────────────────────────────────────────────┘
```

### Dependency flow

```text
app ──► domains ──► components, lib
          │
          └──► services/RepositoryContext ──(interface)──► Repositories
                                                          ▲
              services/http, services/mock ──implement──┘
```

- UI code never imports `services/mock` — enforced by ESLint `no-restricted-imports`.
- `components/` is domain-agnostic: it receives labels/variants, not domain enums.
- `app/router/paths.ts` is a pure module of URL builders and may be imported from any layer.

## Data access

| Piece     | Location                           | Role                                                           |
| --------- | ---------------------------------- | -------------------------------------------------------------- |
| Contract  | `domains/<d>/api/<D>Repository.ts` | Methods and return types the UI relies on                      |
| Aggregate | `services/repositories.ts`         | `Repositories` interface + `createRepositories()`              |
| DI        | `services/RepositoryContext.tsx`   | `RepositoryProvider`, `useRepositories()`                      |
| HTTP      | `services/http/*`                  | REST client (`client.ts`) + one implementation per contract    |
| Mock      | `services/mock/*`                  | In-memory tables (deep-copied per instance), simulated latency |
| Hooks     | `domains/<d>/api/queries.ts`       | Query keys + TanStack Query hooks                              |

List endpoints take a query object (filters, sort, page) and return `PagedResult<ReadModel>`,
so filtering, sorting and paging are server concerns from day one (the mock simulates the
server). Detail endpoints return normalised entities; names are resolved through cached
reference catalogues (`usePeopleById`, `useTeamsById`, …).

Repositories throw `NotFoundError` / `AppError` (`lib/errors.ts`); the query client does not
retry not-found errors.

**Choosing the implementation:** `createRepositories()` returns the HTTP repositories when
`VITE_DATA_SOURCE=http` (`npm run dev:api`, production builds), otherwise the mock. In development
Vite proxies `/api` (and the SSO round trip) to the API, so the browser sees one origin.

**REST mapping.** Every repository method is one endpoint: collections at `/api/<resource>`
(`GET` list, `POST` create), records at `/api/<resource>/{id}` (`GET`, `PUT`, `DELETE`), the
confirmation data at `/api/<resource>/{id}/deletion-impact`, and read models at their own paths
(`/api/applications/{id}/dependencies`, `/api/people/{id}/workload?today=`,
`/api/governance/trends?from=&months=&today=`, `/api/demands/{id}/assessment`…). List filters are
query parameters (arrays repeat the key; optional id lists are comma-separated, empty meaning "none").
Errors are RFC 9457 problem details whose `code` (`validation`, `not-found`, `forbidden`,
`unauthenticated`) and `field` become the same error classes the mock throws; a lost session
(401) clears the cached session so the route guard returns to sign-in. Writes send the CSRF token
from the `XSRF-TOKEN` cookie. The OpenAPI description is served by the API at `/v3/api-docs`.

**Keeping them equal.** A repository change touches the contract, the mock, the HTTP
implementation and the API together. `services/http/apiContract.test.ts` (opt-in,
`CEREBRO_API_URL`) compares both on the demo data; `client.test.ts` covers the HTTP mapping.

## State management

| State                                                | Mechanism                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Server data                                          | TanStack Query (`lib/queryClient.ts`: 60 s stale time, no refetch on focus) |
| Shareable UI state (filters, sort, page, active tab) | URL search params                                                           |
| Local UI state                                       | `useState`                                                                  |
| Environment (repositories)                           | React Context                                                               |

No Redux or Zustand. Adding a global client store requires a decision record.

## UI approach

- **Takeoff UI v2** (`@takeoff-ui/react-spar` 0.6.0) is the design system; tokens come from
  `@takeoff-design/tokens` (default theme) and icons from `@takeoff-icons/react`.
- App-wide Takeoff defaults are set once through `TakeoffSparProvider components` (e.g. compact
  `Table` density).
- Custom CSS (`styles/global.css`) covers layout and composition only and uses Takeoff tokens.
  Custom components exist only where Takeoff has no equivalent: app shell/sidebar navigation,
  `PageHeader`, `DetailList`, `EmptyState`, `Toolbar`.
- Labels, badge colours, order and options of enumerated values come from **master data**
  (`domains/master-data`: `MasterBadge`, `MasterLabel`, `MasterSelectField`, `useMasterData()`);
  badges always show text. Only app-internal values (user roles, account status) keep a static
  `*Presentation.ts` mapping.
- List pages use Takeoff `Table` in `manual` mode with controlled sorting and pagination.
- Detail pages use Takeoff `Tabs` synced to `?tab=`; each tab loads its own data lazily.

## Portfolio aggregates

Dashboard and reports read `GovernanceRepository` (`getPortfolioOverview`,
`getApplicationHealthReport`). The rules live in pure functions
(`domains/governance/utils/portfolio.ts`) so a backend can run the same rules server-side and
they are unit-tested against the seed data. Connection impact analysis
(`domains/connections/utils/impact.ts`) is a breadth-first traversal over the dependency edges.

## Shared UI patterns

`PageHeader`, `DetailTabs` (tabs synced to `?tab=` via `useTabParam`), `SectionCard`,
`DetailList`, `Toolbar` + `SearchField` + `FilterSelect` + `FilterSummary`, `StatTile`,
`BarList`, `PercentMeter`, feedback states. Cross-domain composites live in their owning domain:
`StakeholderList` (people), `RelatedRisksAndEscalations`/`RiskTable` (risks), `EscalationTable`,
`DecisionList`, `DocumentationTable` (shared), `AuditHistory` and `AttentionNotices` (governance).

## Responsive layout

- Content (forms included) uses the full width up to `--c-content-max` (1920px).
- ≤ 900px: the sidebar is replaced by a menu button that opens the navigation in a Takeoff `Drawer`
  (`app/layout/MobileNavigation`); the top bar compacts.
- ≤ 600px: form grids and detail lists collapse, stat tiles and key facts use two columns, filters
  go two per row, the brand text and user name hide. Tables scroll horizontally inside their card;
  the page itself never scrolls sideways. The master data page swaps its list navigation for a
  grouped select.

## Colour mode

Light and dark mode come from Takeoff tokens (`[data-theme='dark']`). `AppProviders` holds the mode
(stored choice in `localStorage` `cerebro.theme`, otherwise the OS preference, followed live) and
passes it to `TakeoffSparProvider`, which sets `data-theme` on `<html>`. An inline script in
`index.html` applies the same choice before first paint. The top bar has a `ThemeToggle`. Custom CSS
must use tokens that are redefined for dark mode (e.g. `--static-light`, `--primary-lightest`, not
`--static-white` / `--primary-50`); text accents on dark surfaces use `--primary-dark`. The dark palette is softened in `global.css`:
surfaces use `--neutral-800` above a `--neutral-900` page, and hairlines are translucent white.

## Routing

`app/router/routes.tsx` defines the route tree (pages are `React.lazy`), `paths.ts` builds URLs.
Every navigation entry has a real page; entity detail pages exist for applications, projects,
teams and technologies.

## Authentication & roles

- **Privileges** are a fixed catalogue in code (`PRIVILEGE_MODULES` in `domains/auth/types`): one
  module per screen (dashboard, projects, applications, connections, risks, reports, teams, people,
  technologies, resources, leaves, demands, demandManagement, masterData, users, roles) with the
  levels it supports — `view` (read-only), `edit`, `delete`; each level implies the lower ones.
  Privilege codes are `<module>:<level>` and typed (`Privilege`), so a misspelt check fails to
  compile.
- **Roles** are records (`Role`: name, description, privileges, `system`), administered at
  `/admin/roles` (roles, the screen × role matrix and the privilege catalogue). The system role
  holds everything and is locked. **Users** hold one or more roles (`roleIds`); their access is the
  union. The server resolves it into the session (`SessionUser.privileges`, `roleNames`) on every
  request, so role changes apply without signing in again. Seed roles: Sistem yöneticisi, Portföy
  ofisi, Birim / ekip yöneticisi, İş birimi kullanıcısı, Çalışan, Denetçi (salt okunur).
- **Enforcement is server-side**: every repository write calls `WriteKit.begin(<module>:<level>)`
  (`MockAuthority.require`) and throws `ForbiddenError` / `UnauthenticatedError`; user and role
  reads need `users:view` / `roles:view`, and global search returns only kinds the user may view.
  The UI mirrors the rules: every route is wrapped by `guarded(page, privilege)`
  (`RequirePrivilege`), navigation lists only viewable screens, `<Can>` / `CreateAction` /
  `EditAction` / `GuardedActionMenu` take the screen's privilege. A user without the dashboard
  lands on their first viewable screen (`HomeRoute`).
- Reads of portfolio data are open to every signed-in account (forms pick people, teams and
  applications from every screen); contracts and vendors need `contracts:view`, users and roles
  `users:view` / `roles:view`, files the `view` privilege of their record's screen. Screens are
  guarded in the UI as well. Mock and API apply the same rules.
- Sign-in: locally and in the demo, an account picker (`/sign-in`); in production the API's
  corporate SSO (OIDC) — `AuthRepository.getSingleSignOnUrl()` tells the sign-in screen where to
  send the browser. Cerebro never stores passwords. Redirect targets are restricted to same-app
  paths.
- User administration keeps the system administrable: at least one role per user, no
  self-deactivation, no removing your own system role, at least one active system administrator,
  unique emails. Roles held by users cannot be deleted.

## Forms

- React Hook Form + Zod, following Takeoff's official RHF guide (`Controller`, `Field invalid`,
  `aria-invalid`). Field components: `components/forms/fields.tsx` (`TextField`, `SelectField`,
  `ChipsField`, `MultiSelectField`, `SwitchField`) and `DateField` (Takeoff `useDatePicker` +
  `Popover` + `Calendar`).
- Form values are plain strings/arrays; each domain's `schemas/*Form.ts` has the Zod schema plus
  pure mappers `toXFormValues(entity)` / `toXInput(values)` (round-trip tested).
- `FormPage` provides the error summary, sticky action bar, server `ValidationError` → field
  mapping, and an unsaved-changes guard (`useBlocker` + `beforeunload`).
- `DeleteAction` loads `getDeletionImpact` first and states what will be affected; deletion can be
  blocked (e.g. a technology still in use).
- Mutations use `useRepositoryMutation`: success toast (Takeoff `Toaster`), then all non-auth
  queries are invalidated because writes cascade across domains.
- URLs must be http(s); free text next to environments/integrations is rejected when it looks like
  a credential (`looksLikeSecret`).

## Identifiers and database shape

- `EntityId = number`: a per-table sequence value, assigned by the server (`WriteKit.nextId`).
- Aggregates are written with `Draft<T>` child rows; `WriteKit.withIds` keeps stored ids, assigns
  new ones and rejects foreign ones.
- Forms hold ids as text (select values) and convert at the boundary (`idText`, `toId`,
  `toIdOrNull` in `lib/validation.ts`); route params go through `parseId` (`lib/urlParams.ts`).
- Relational schema with sequences, foreign keys and link tables: `docs/database-schema.sql`.

## Master data

- Catalogue of lists: `domains/master-data/catalog.ts` (label, group, `systemCodes`, `extensible`,
  `colored`, where used). Seed items: `services/mock/data/masterData.ts`.
- Repository: `MasterDataRepository` (`listAll`, `getUsage`, `update(key, items)`), plus writes on
  `people` and `businessUnits` with deletion impact (referenced people / units in use are blocked).
- Reading: `MasterDataProvider` (inside the authenticated shell) → `useMasterData()` with `label`,
  `badge`, `options(key, keep)`, `items`. Components: `MasterBadge`, `MasterLabel`,
  `MasterSelectField` (keeps an inactive current value selectable).
- Page: `/admin/master-data?section=<list key | business-units | people>` — searchable navigation,
  a value list editor (reorder, rename, recolour, (de)activate, add/remove custom values, usage
  counts) and table + dialog editors for business units and people.

## Person page

- `/people/:personId` — one screen with everything a person is mapped to: key facts (business
  unit, teams, headed units, leave status), applications and projects they hold a role on or
  work on through one of their teams (direct roles first), escalations they own or raised, risks
  they own, decisions they took part in, and current/upcoming leaves.
- Read model `PersonWorkload` from `PersonRepository.getWorkload(id, today)` — one call, built by
  joins in the repository (`services/mock/personWorkload.ts`), not N register queries in the UI.
- Every person name links here: `PersonSummary` (team members, key facts, stakeholders), team
  managers, the people editor and the leave calendar.

## Attachments

- `Attachment` (owner `{ type, id }`, `documentType` from master data `documentTypes`, file
  name, content type, size, description, uploader). `AttachmentRepository`: `list(owner)`,
  `countByOwner(type)`, `upload`, `update`, `remove`, `download`. Uploading needs
  the owning screen's `edit`, deleting its `delete` privilege (demand files follow the demand's own rule, see
  Demand management); reading is open to everyone.
- Bytes are not in the mock database: `BlobStore` (IndexedDB in the browser, memory in tests)
  keeps them under the attachment id, like object storage would. Seed files are metadata only;
  their bytes are valid PDFs generated from the metadata (`samplePdf`). Bytes of files whose
  record was deleted are dropped when the backend starts (`BlobStore.retain`).
- Validation in the repository (and the picker's `accept`): an allow-list of document, image,
  diagram and archive extensions (no executables, scripts, HTML or SVG), 1 byte–20 MB, sanitised
  file names, secret-free descriptions, a known document type and an existing owner.
- `REQUIRED_DOCUMENTS` lists the document types each record type must carry (applications,
  projects); `RequiredDocuments` shows them as a checklist with per-row upload.
- UI: `AttachmentsSection`/`AttachmentsPanel` (checklist, `AttachmentUploader` on Takeoff
  `Upload`, `AttachmentTable` with open/download/edit/delete and Excel export) on the
  documentation tabs, team and technology pages and the risk/escalation/decision edit forms
  (`FormPage` `after` slot, outside the `<form>`); `AttachmentsButton` opens the panel in a
  dialog from register rows and decisions.
- Tables with row-level dialogs memoise their column definitions: Takeoff's table remounts a
  cell when its renderer changes, which would reset an open dialog.

## Purchases and contracts

- Domain `contracts`: `Contract` (+ `payments`), `Vendor`; `ContractRepository`
  (`list({ projectId?, vendorId? })`, `getById`, writes) and `VendorRepository`. Reads need
  `contracts:view` — commercial terms are not for every role — writes `contracts:edit`, deletes
  `contracts:delete`; contract files follow the same privilege.
- `utils/contractSchedule.ts`: notice deadline (end − notice days), alerts (active past its end,
  ending within 90 days, notice within 30, overdue instalments), payment summary by stage and
  totals per currency (never converted), upcoming events.
- UI: `/contracts` (contracts, upcoming dates, vendors), contract detail and form (payment plan
  editor with a running total), and the project's "Satın alma" tab (committed vs project budget in
  the budget currency, paid, overdue). The tab is hidden without `contracts:view`.

## Demand management

- `Demand` (requester part + `assessment` + `history: DemandEvent[]`), master data lists
  `demandStatuses` (workflow, system codes), `demandTypes`, `demandBenefitTypes`,
  `demandPriorities`; urgency reuses `criticalities`. `DemandRepository`: `list`, `getById`,
  `create`, `update`, `assess`, `withdraw`, `remove`, `getDeletionImpact`.
- Privileges: `demands:edit` (raise and manage your own) and `demandManagement:edit`/`delete` (the portfolio office). The ownership rule
  ("own demand, not yet decided") is one pure module, `domains/demands/utils/demandAccess.ts`,
  used by the repository to enforce it and by the UI to hide what would be refused. A requester
  editing a demand in `needs-info` puts it back to `submitted`. Status rules (reason to reject or
  ask, priority to approve, dates to schedule, project to convert) are checked by the repository,
  mirrored in the assessment form schema and in database `CHECK`s.
- Demand files use the attachments module with an `access` override: the requester manages the
  files of their own open demand, the repository authorises the same way.
- Scoring is WSJF (`utils/demandScoring.ts`): (value + fit + time criticality + risk reduction)
  ÷ effort, with thresholds suggesting P1–P4; the backlog is ordered by decided priority, score,
  regulatory flag and age. `utils/roadmap.ts` buckets approved/scheduled demands into quarters.
- Pages: `DemandsPage` (Taleplerim / Tüm talepler), `DemandFormPage`, `DemandDetailPage`,
  `DemandManagementPage` (Gelen kutusu, Önceliklendirme, Yol haritası, Kapananlar) with
  `DemandAssessmentDialog` (Takeoff `Radio` score rows, quarter shortcuts).

## Excel export

- `lib/xlsx.ts` writes Office Open XML directly (zipped with `fflate`): inline strings only (no
  formulas, so no spreadsheet formula injection), typed number/date/percent cells, a styled
  frozen header row with an auto-filter, content-fitted column widths and hyperlinks for `link`
  columns. It is loaded with `import()` on click; tables only import the sheet types from
  `lib/xlsxTypes.ts` (`sheet<T>()`, `describeFilters`).
- `components/actions/ExcelExportButton` ("Excel'e aktar") builds the sheets on click, adds the
  context line (filters · row count · export time) and downloads `<title>-<date>.xlsx`;
  `TableExportBar` places it above a table that has no header of its own.
- Exports use labels, not codes (master data), and resolve names when clicked
  (`domains/shared/utils/portfolioNames.ts` reads application/project names from the
  repositories) instead of subscribing tables to extra queries. Shared sheet definitions:
  `applicationSheet`, `projectSheet`, `personWorkbook`.
- Paged lists (applications, projects) re-query with the page's filters and a large page size so
  the file holds every match. Chart tables keep raw numbers (`ChartTable.types`) so numbers reach
  Excel as numbers.

## Report charts

- `GovernanceRepository.getTrends(period, today)` returns `PortfolioTrends`: monthly series
  (aligned with `months`) and today's distributions, built by the pure `buildPortfolioTrends`
  (`domains/governance/utils/trends.ts`, tested). Past months use actual dates, later months
  plans; `null` marks "no data" (a gap, not a zero).
- Chart primitives in `components/charts`: `MonthlyChart` (lines or stacked columns, plan
  region, crosshair + keyboard tooltip), `CategoryBars` (distribution with value and share,
  rows link to filtered lists), `HeatMatrix` (risk matrix as a real table), `ChartCard`
  (title, takeaway, legend, chart ↔ table toggle). SVG, no chart library.
- Colours: `--c-chart-1…8` categorical slots (validated for colour-vision deficiency and
  contrast, separate light/dark steps) for identities such as projects; coded values use their
  master data badge colour (`--c-chart-v-<variant>`), falling back to slots when two values in
  one chart share a colour (`codedColors`). Text never wears a series colour.
- Report period lives in the URL (`?period=12-6|24|plan`); while a new period loads the previous
  charts stay on screen, dimmed.

## Incident runbooks

- `Runbook` (one per application; `application_runbooks` + child tables for ordered steps, links,
  contacts and scenarios). `RunbookRepository.getByApplication` returns `null` when none exists;
  writes follow portfolio permissions; deleting the application deletes its runbook.
- Application tab "Sorun anında" (`?tab=runbook`, second tab): summary with verification state
  (stale after 180 days), first-response checklist (ticks are local to the browser tab — a place
  keeper, not a record), contacts in escalation order (person/team details resolved live),
  addresses to check plus the production/DR environment URLs, and known problems searchable by
  symptom (`matchScenarios`).
- Edit page `/applications/:id/runbook/edit`: steps are written one per line in a text area and
  stored as ordered rows; links, contacts and scenarios are reorderable lists (`RepeatableList`
  `onMove`). Every text is checked for credentials (client schema and repository).
- Text search everywhere folds Turkish casing and accents (`lib/search.ts`): "timeout" finds
  "PROVIDER_TIMEOUT", "celik" finds "Çelik".

## Resource planning

- Entity `Allocation` (person, project, role from `stakeholderRoles`, inclusive dates, `percent`
  5–100 in steps of 5, note); table `resource_allocations` (check constraints + an exclusion
  constraint against booking one person twice onto one project for overlapping days).
  Allocations on _different_ projects may overlap — that is the parallel work being managed.
- `AllocationRepository.list({ from, to, personIds?, projectIds? })`; writes need
  `resources:edit`. Deleting a project deletes its allocations.
- Page `/resources`: URL state in `utils/planParams.ts`; pure planning maths in
  `utils/resourcePlan.ts` (periods, scale, clipping, greedy lane assignment = max parallel work,
  daily load runs, peak) — tested. Load bands (`free/partial/full/over`) are presented from
  `utils/loadPresentation.ts`.
- `ResourceTimeline`: a table (row header per person) whose track cell positions bars with CSS
  variables (`--o` offset, `--s` span, `--l` lane) at a per-zoom day width. Bars keep a stable
  colour per project; the load strip and leave shading are decorations that ignore clicks, so a
  click on empty track space means "allocate this person from this day" (admins).
- `AllocationDialog` fills empty dates from the project timeline and previews the person's peak
  load with the new allocation before saving (over 100 % is allowed but stated).
- The person page shows current/upcoming allocations and today's load.
- Shared guards for portalled layers live in `lib/outsideInteraction.ts` (dialogs ignore clicks in
  selects/pickers; popovers ignore clicks in dialogs opened from them).

## Leave management

- Entity `LeaveRecord` (`personId`, `type` from the `leaveTypes` master data list, inclusive
  `startDate`/`endDate`, short `note`); table `leave_records` with a check on the dates and an
  exclusion constraint so one person has at most one leave per day.
- Repository `LeaveRepository.list({ from, to, personIds? })` returns leaves overlapping a period;
  writes need `leaves:edit`. The mock rejects overlaps with a field error on `startDate`.
- Page `/leaves` (everyone can read): URL state in `utils/leaveParams.ts`; calendar maths (periods,
  days, month headers, bar segments, working days) in `utils/leaveCalendar.ts` — pure and tested.
- `LeaveTimeline` is a real `<table>` (row headers = people, column headers = days) with sticky
  header/column; bars are popover triggers with the full description as their accessible name.
  Admins click an empty day to open `LeaveDialog` prefilled. Colours come from the master data
  variant via `.c-leave--<variant>` (separate light and dark steps in `global.css`).

## Development persistence

The mock database and session are persisted in `localStorage` in the browser
(`cerebro.demo-db.v9`, `cerebro.demo-session.v2`) so records survive a reload. Tests use in-memory
stores. To reset the demo data, clear the site's storage (or remove `cerebro.demo-db.v7`).

## Security posture (frontend)

- Demo sign-in only; OIDC will replace it. Authorisation is enforced in the repository layer
  (the future backend); UI-level hiding of actions is a convenience only.
- Records never contain credentials; the mock-data integrity test scans for credential-like
  fields.
- External links open with `rel="noopener noreferrer"`.

## Testing

Vitest + Testing Library (jsdom). Tests cover pure domain logic, URL state parsing, repository
behaviour, seed-data integrity and the list → detail user flow through the real route tree
(`test/renderWithProviders.tsx`).
