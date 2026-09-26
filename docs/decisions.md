# Cerebro — Decision Log

Short records of decisions that shape the codebase. Newest first.

## D-013 · Turkish user interface, English code (2026-09-26)

Everything a user sees — labels, messages, validation, toasts and mock data — is Turkish; code,
identifiers, comments and docs stay English. Strings live inline (no i18n framework) because only
one language is needed; introduce one if a second language is ever required. Dates format with the
date-fns `tr` locale and numbers with `tr-TR` (`lib/dates.ts`, `lib/format.ts`). Turkish nouns stay
singular after numbers, so `pluralize` defaults the plural to the singular. Choice-validation
labels are lower-case accusative phrases (`bir rol`, `bağımlı uygulamayı`) rendered as
`<Label> seçin.`. Record ids stay English slugs (`app-payment-gateway`); new ids are slugified
with Turkish characters folded to ASCII. The dev mock database key moved to
`cerebro.demo-db.v2` so browsers reload the translated seed.

## D-012 · Saving a record counts as a review (2026-09-26)

Editing a record through its form sets `lastReviewedAt/By`: the editor has just seen every field.
This keeps "review overdue" meaningful without a separate review workflow (a dedicated
"Mark as reviewed" action can be added later).

## D-011 · Mock data persists in development (2026-09-26)

Records created in the browser survive reloads (localStorage), otherwise the demo is confusing.
Writes are persisted by wrapping repositories (`afterWrites`) so no write path can forget to save.

## D-010 · Form values are strings; mapping is explicit (2026-09-26)

Rather than Zod transforms (which split input/output types across React Hook Form generics), form
values mirror inputs as strings/arrays and each domain maps them explicitly. Mappers are tested
for lossless round-trips against the seed data.

## D-009 · Two roles, enforced server-side (2026-09-26)

`admin` (everything + user management) and `user` (read-only), as requested. The permission table
is shared; the repository (backend) is authoritative and the UI mirrors it. Accounts are
deactivated rather than deleted to keep audit history intact.

## D-008 · Wrap `Button as={Link}` in `ButtonLink` (2026-09-26)

Takeoff 0.6.0 sets `role="button"` on polymorphic anchors. Screen readers would announce
navigation as a button. `components/actions/ButtonLink` passes `role="link"`, which the library
honours. Remove when Takeoff fixes the default.

## D-007 · App-wide Takeoff defaults through the provider (2026-09-26)

Density (`Table size="small"`) is set once via `TakeoffSparProvider components` instead of a
wrapper component or per-call props — this is Takeoff's documented mechanism.

## D-006 · Completeness is rule-based, weighted and explained (2026-09-26)

A bare score is not actionable. Rules are data (`CompletenessRule`), required rules weigh 3 and
recommended 1, rules can opt out via `appliesTo`, and the UI always lists what is missing.

## D-005 · List state lives in the URL (2026-09-26)

Filters, sort, page and detail tab are URL search params so views are shareable and survive
back/forward. Parsing tolerates invalid input and omits defaults.

## D-004 · Server-shaped list queries from day one (2026-09-26)

Repositories accept `{ filters, sort, page }` and return `PagedResult` of denormalised read models;
Takeoff `Table` runs in `manual` mode. The mock simulates the server so the UI does not change
when a backend arrives, and the design holds at 500+ applications.

## D-003 · Contextual roles and responsibility-tagged team assignments (2026-09-26)

Ownership is `RoleAssignment[]` / `TeamAssignment[]` on applications and projects rather than
fixed `technicalOwnerId` fields, so a person or team can hold different roles in different
contexts and multiple holders are possible.

## D-002 · Repository interfaces + context DI; no backend chosen (2026-09-26)

No backend exists and none is specified. UI depends on interfaces injected through
`RepositoryProvider`; tests inject their own instances. REST vs GraphQL is deferred.

## D-001 · Toolchain versions (2026-09-26)

- TypeScript 6.0 (not 7): `typescript-eslint` 8.x supports `<6.1`.
- React Router 7 and jsdom 29: their newest majors require Node ≥ 22.22; local baseline is 22.18.
- Takeoff UI v2 `@takeoff-ui/react-spar` 0.6.0 (current), React 19.
- Takeoff UI MCP was configured but unresponsive during setup; APIs were verified against the
  installed type definitions and the version-matched official docs instead.
