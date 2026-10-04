---
name: cerebro-code-quality
description: Cerebro code-quality bar and completion gate — strict TypeScript, no any, small cohesive components, no duplicated logic or visual patterns, no dead code or console.log, domain types, Zod schemas, meaningful tests, predictable error handling, and mandatory lint/typecheck/test/build before completion. Activate before declaring any task done, when refactoring, or when writing tests.
---

# Cerebro Code Quality

## 1. TypeScript

- Strict mode with `noUncheckedIndexedAccess`; handle `undefined` from indexing explicitly.
- No `any`. Use `unknown` + narrowing, generics, or a precise domain type.
- No `@ts-ignore` / `@ts-expect-error` without a one-line justification.
- `import type` for type-only imports (`verbatimModuleSyntax`).
- Prefer discriminated unions and literal unions over booleans + optional fields.
- Exhaustive `switch` over unions with a `never` check (or a `Record<Union, …>` mapping).

## 2. Components

- One responsibility per component; split out querying, transformation, form state and
  independent sections when they grow together.
- Props are typed interfaces named `<Component>Props`.
- Stable `key`s from entity ids — never array indices for entity lists.
- No business logic inside JSX — derive in `utils/` (pure, tested) or a hook.
- No inline status → colour/label logic or hard-coded option lists; use master data
  (`MasterBadge`, `MasterLabel`, `MasterSelectField`, `useMasterData`).
- No duplicated visual patterns: reuse `PageHeader`, `DetailList`, `EmptyState`, `ErrorState`,
  `LoadingState`, `EntityLink`, `Toolbar`.

## 3. Hygiene

- No `console.log` (ESLint allows only `console.warn/error`, and only for real diagnostics).
- No dead code, commented-out code, or unused exports.
- No TODOs for functionality that should work now; future work goes to `docs/roadmap.md`.
- Constants are defined once (enum arrays, route paths, thresholds in config modules).
- Don't add dependencies without a clear reason; record notable ones in `docs/decisions.md`.

## 4. Errors

- Repositories throw typed errors (`NotFoundError`, `AppError` from `src/lib/errors.ts`).
- Pages distinguish: not found → `NotFound`; load failure → `ErrorState` with retry;
  mutation failure → inline form error + toast; validation → field-level messages.
- Never swallow errors silently.

## 5. Tests (Vitest + Testing Library)

Prioritise, in order:

1. Domain utils (filters, sorting, derivations, completeness, master data rules).
2. Zod schemas (valid + each invalid branch that matters).
3. Repository behaviour (query, filter, paging, not-found).
4. Mock data integrity (all references resolve).
5. Key user flows (list → detail navigation, filter interaction).

Query by role/label/text (`getByRole('link', { name: … })`), not by class names or test ids unless
unavoidable. No snapshot tests for coverage. Use `renderWithProviders` from `src/test/`.

## 6. Completion gate

Run and pass, in order:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

(`npm run validate` runs all four, in `frontend/`.) When `backend/` or a repository contract
changed, also run `./mvnw verify` in `backend/` and the mock↔API contract test (see CLAUDE.md).
Fix every issue introduced by the change. Report the results
honestly in the task summary — including anything skipped and why.
