---
name: cerebro-feature-development
description: Step-by-step workflow for implementing any Cerebro feature end-to-end (plan → domain → data → UI → states → tests → validation → summary). Activate whenever asked to build, add, extend or implement a feature, page, tab, form, filter or workflow in Cerebro, so implementations are planned rather than rushed.
---

# Cerebro Feature Development Workflow

Follow the steps in order. Steps 1–9 are a short written plan (a few lines each) before code.

## Plan

1. **Objective** — restate the feature in one or two sentences from the user's perspective and
   name the question it answers ("Who owns this application?").
2. **Domain entities** — list affected entities and relationships. If a new field/relationship is
   needed, apply the `cerebro-domain-model` skill first.
3. **Routes** — new/changed routes; add builders to `src/app/router/paths.ts`. Decide which UI
   state belongs in the URL (filters, sort, page, tab).
4. **Data** — repository methods needed, query keys, hooks; read model vs entity; pagination.
   Consider 500 applications / 200 projects.
5. **Takeoff UI components** — list them and verify each via Takeoff MCP or installed types
   (`takeoff-ui-development` skill).
6. **Reusable app components** — check `src/components` and domain `components` first
   (`PageHeader`, `DetailList`, `EntityLink`, `EmptyState`, `ErrorState`, `LoadingState`,
   `Toolbar`). Extend rather than duplicate.
7. **Validation rules** — Zod schema fields, required/optional, cross-field rules.
8. **States** — loading, empty (specific copy + action), error (retry), not found, permission.
9. **Tests** — which pure functions, schemas, repository behaviours and user flows get tests.

## Build

10. **Implement** in this order: types → repository contract → mock implementation + seed data →
    query hooks → utils (+tests) → components → page → route/nav.
11. **Run checks**: `npm run validate` (typecheck, lint, test, build). Fix everything you
    introduced; do not suppress errors with `any`, `// @ts-ignore` or `eslint-disable`
    unless justified in a comment.
12. **Summarise**: what changed, Takeoff components used (and how verified), files, validation
    results, follow-ups. Update docs if an architectural pattern changed.

## Definition of done

- [ ] typecheck, lint, tests, build pass
- [ ] loading / empty / error states exist
- [ ] Takeoff APIs verified; no invented props
- [ ] route works and is deep-linkable
- [ ] keyboard + labels + visible text for statuses
- [ ] no duplicated logic or visual pattern
- [ ] docs updated when needed
