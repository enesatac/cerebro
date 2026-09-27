# Cerebro — Architecture

Cerebro is a React single-page application. There is no backend yet; all data flows through
typed repository interfaces backed by an in-memory implementation, so an HTTP backend can be
introduced without rewriting the UI.

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
│ services/mock in-memory implementation + seed data           │
└──────────────────────────────────────────────────────────────┘
```

### Dependency flow

```text
app ──► domains ──► components, lib
          │
          └──► services/RepositoryContext ──(interface)──► Repositories
                                                          ▲
                              services/mock ──implements──┘
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
| Mock      | `services/mock/*`                  | In-memory tables (deep-copied per instance), simulated latency |
| Hooks     | `domains/<d>/api/queries.ts`       | Query keys + TanStack Query hooks                              |

List endpoints take a query object (filters, sort, page) and return `PagedResult<ReadModel>`,
so filtering, sorting and paging are server concerns from day one (the mock simulates the
server). Detail endpoints return normalised entities; names are resolved through cached
reference catalogues (`usePeopleById`, `useTeamsById`, …).

Repositories throw `NotFoundError` / `AppError` (`lib/errors.ts`); the query client does not
retry not-found errors.

**Introducing a backend:** implement each repository interface over HTTP in
`services/http/`, return it from `createRepositories()`, and keep the same query keys. No page or
component changes are required.

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

- Two roles (`domains/auth`): **admin** — create, edit, delete everything and manage users;
  **user** — read-only. The single permission table is `ROLE_PERMISSIONS`
  (`portfolio:view`, `portfolio:edit`, `portfolio:delete`, `users:manage`).
- **Enforcement is server-side**: every repository write calls `MockAuthority.require(...)` and
  throws `ForbiddenError` / `UnauthenticatedError`. The UI only mirrors the rules:
  `RequireAuth` (shell), `RequirePermission` (form and admin routes), `<Can>` / `CreateAction` /
  `EditAction` (buttons).
- Sign-in is a demo account picker (`/sign-in`); corporate SSO (OIDC) replaces `AuthRepository`
  later. Cerebro never stores passwords. Redirect targets are restricted to same-app paths.
- User administration keeps the system administrable: no self-deactivation, no removing your own
  admin role, at least one active admin, unique emails. Accounts are deactivated, never deleted.

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

## Development persistence

The mock database and session are persisted in `localStorage` in the browser
(`cerebro.demo-db.v4`, `cerebro.demo-session.v2`) so records survive a reload. Tests use in-memory
stores. To reset the demo data, clear the site's storage (or remove `cerebro.demo-db.v4`).

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
