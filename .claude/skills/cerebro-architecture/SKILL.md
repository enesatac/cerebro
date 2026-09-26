---
name: cerebro-architecture
description: Cerebro's frontend architecture — folder boundaries, dependency rules, repository/data-access layer, state management, naming and TypeScript rules. Activate when adding a new domain module or page, creating a repository/service, changing providers or routing, reorganising directories, introducing a dependency, or starting any major feature.
---

# Cerebro Architecture

## 1. Layers and folders

```text
src/
├── app/                      # composition root — the only layer that knows everything
│   ├── providers/            # AppProviders: Takeoff, QueryClient, RepositoryProvider, Toaster
│   ├── router/               # routes.tsx (route table), paths.ts (URL builders)
│   └── layout/               # AppShell, sidebar navigation config, top bar
├── components/               # cross-domain, domain-agnostic UI building blocks
│   ├── layout/               # PageHeader, PageSection, Toolbar
│   ├── data-display/         # DetailList, EntityLink, TagList, ExternalLink
│   └── feedback/             # LoadingState, EmptyState, ErrorState, NotFound
├── domains/
│   ├── shared/               # EntityId, EntityRef, AuditMetadata, DocumentationLink, paging
│   └── <domain>/             # applications, projects, teams, people, technologies, ...
│       ├── types/            # domain types (entities, value objects, read models, queries)
│       ├── api/              # <Domain>Repository interface + TanStack Query hooks + query keys
│       ├── utils/            # pure functions: presentation mappings, filters, derivations
│       ├── schemas/          # Zod schemas (forms, input validation)
│       ├── components/       # domain UI (used by this domain's pages or other domains' pages)
│       └── pages/            # route-level components (lazy-loaded)
├── services/
│   ├── repositories.ts       # Repositories interface (aggregate of all domain repositories)
│   ├── RepositoryContext.tsx # DI: RepositoryProvider + useRepositories()
│   └── mock/                 # Mock*Repository implementations + seed data (never imported by UI)
├── lib/                      # framework-agnostic helpers: dates, errors, query client, strings
└── styles/                   # global.css (tokens-based layout only)
```

## 2. Dependency rules

| From → To                                                                                       | Allowed?                                                |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `app` → anything                                                                                | ✅ (composition root)                                   |
| `domains/X/pages` → `domains/X/*`, `domains/Y/components`, `domains/Y/api`, `components`, `lib` | ✅                                                      |
| `domains/X/types` → `domains/shared/types`, `domains/Y/types` (type-only)                       | ✅                                                      |
| `domains/*` → `services/RepositoryContext` (hooks only)                                         | ✅                                                      |
| `domains/*` → `services/mock/*`                                                                 | ❌ ESLint `no-restricted-imports`                       |
| `components/*` → `domains/*`                                                                    | ❌ components stay domain-agnostic; pass data via props |
| `lib/*` → React components / domains                                                            | ❌                                                      |
| `services/mock` → `domains/*/types`, `domains/*/utils` (pure)                                   | ✅                                                      |

`app/router/paths.ts` is the one exception to "only `app` imports `app`": it is a pure module of URL
builders and may be imported from any layer so no route string is duplicated.

Cross-domain imports go through a domain's **public surface** (`types`, `api` hooks, `components`,
`utils`) — never reach into another domain's `pages`.

## 3. Data access

1. Each domain defines its contract in `domains/<d>/api/<D>Repository.ts`:
   ```ts
   export interface ApplicationRepository {
     list(query: ApplicationListQuery): Promise<PagedResult<ApplicationListItem>>;
     getById(id: ApplicationId): Promise<Application>; // throws NotFoundError
   }
   ```
2. `services/repositories.ts` aggregates all interfaces into `Repositories`.
3. `services/mock/createMockRepositories()` returns in-memory implementations with simulated
   latency. A future `services/http/createHttpRepositories()` returns the same interface.
4. `RepositoryProvider` (in `app/providers`) injects the implementation; tests inject their own.
5. Components consume **query hooks** (`useApplicationList`, `useApplication`) — never repositories
   directly, never `fetch`.
6. Query keys live in one `queryKeys.ts` per domain (`applicationKeys.list(query)`).
7. Repositories return **read models** where the UI needs joined data (e.g. `ApplicationListItem`
   with resolved owner/team names) and **normalised entities** for detail/edit.
8. Errors: repositories throw `NotFoundError` / `AppError` from `lib/errors.ts`; pages map them to
   `NotFound` / `ErrorState`.

## 4. State management

| State                                                    | Where                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| Server data                                              | TanStack Query (cache, dedupe, retries)                            |
| URL-shareable UI state (filters, sort, page, active tab) | URL search params (`useSearchParams`)                              |
| Component-local UI state                                 | `useState` / `useReducer`                                          |
| Narrow shared state (e.g. repositories, theme)           | React Context                                                      |
| Complex global client state                              | Zustand — **only** with a recorded decision in `docs/decisions.md` |

Redux is not used.

## 5. Components

- Pages orchestrate: read params → call hooks → render sections. No data transformation inline.
- Split a component when it owns more than one of: querying, transformation, form state,
  complex presentation, multiple independent sections.
- Pure derivations live in `utils/` and are unit-tested.
- Presentation mappings (status → label/badge variant) live in `utils/*Presentation.ts`.

## 6. Naming

- Business language: `ApplicationDependency`, `RoleAssignment`, `DocumentationLink`
  (not `RelationData`, `PersonInfo2`).
- Types/interfaces `PascalCase`; union literal values `kebab-case` strings (`'pre-production'`).
- Hooks `useX`; repository methods `list`, `getById`, `create`, `update`, `remove`.
- Route builders `paths.applications.detail(id)`.

## 7. TypeScript

- `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` — use `import type`.
- No `any`; use `unknown` + narrowing. No non-null `!` unless an invariant is proven nearby.
- Unions of string literals are defined as `const` arrays + derived type so UI can iterate options:
  `export const LIFECYCLES = ['planned', …] as const; export type Lifecycle = (typeof LIFECYCLES)[number];`
- Branded ids are not used (kept simple); id aliases (`type ApplicationId = string`) document intent.

## 8. Introducing a new module (checklist)

1. Add types in `domains/<d>/types` and document the entity in `docs/domain-model.md`.
2. Add repository interface + mock implementation + seed data; register in `repositories.ts`.
3. Add query keys + hooks.
4. Add path builders in `app/router/paths.ts`, route in `routes.tsx`, nav item if top-level.
5. Build pages with `PageHeader` + shared feedback states.
6. Tests for utils, repository behaviour and key flows.
7. Update `docs/architecture.md` / `docs/decisions.md` if a pattern changed.
