# Cerebro — Decision Log

Short records of decisions that shape the codebase. Newest first. Entries `B-…` were taken over
from the separate backend repository when it was merged into this one.

## D-031 · Seed migrations are frozen; new catalogue entries get their own (2026-10-05)

V2 (privileges) and V3 (master data) are released migrations, and Flyway refuses a changed one.
The seed generator still produces them from the frontend, but byte for byte as released: a new
privilege module or value list is listed in `LATER_SEEDS` (`frontend/scripts/backend-seed.gen.ts`)
and generated into a new migration (V6 for the procurement tracker), which also grants it to the
system role. The catalogue tests read every migration.

## D-030 · Procurement tracker: the process without the price (2026-10-05)

Business units want to see where their purchases stand without being able to see what they cost.
The tracker is its own screen and privilege module (`procurement`, view/edit) on top of contracts:
a purchase is a contract, its process is ordered steps (type and status from master data, owner,
planned and actual dates, a short note) plus a log of notes. Its read model carries the contract's
identity, project, business unit and supplier but no amounts, so `procurement:view` can be given to
business units while `contracts:view` stays with the portfolio office. Where a purchase stands
(not started, in progress, late, blocked, completed) is derived from the steps, not stored.
Internal notes are only returned to `procurement:edit`. Steps and notes are deleted with their
contract; people in them cannot be deleted.

## D-029 · Sessions in the database (2026-10-04)

OpenShift runs two or more pods and replaces them one by one on every deploy. In-memory sessions
would sign users out on each rollout or need sticky routing. Spring Session keeps them in Oracle
(`SPRING_SESSION*`, migration V4); the cookie stays httpOnly, Secure and SameSite=Lax, set
explicitly rather than inherited from the container.

## D-028 · Oracle, written for 19c and tested on H2's Oracle mode (2026-10-04)

The organisation runs Oracle, so PostgreSQL was dropped before the first release and the schema
restarted at V1 in Oracle SQL. It targets 19c (the oldest likely version): identity columns,
NUMBER(1) booleans, JSON in CLOB for string lists, no 23ai-only syntax, and Oracle's '' = NULL is
handled when reading. PostgreSQL-only guarantees became application rules: range exclusion
(overlapping leaves/allocations) is checked under a row lock on the person; master data codes are
checked by the services rather than composite foreign keys. Tests run on H2 in Oracle
compatibility mode by default (no database server needed, including '' = NULL), and on a real
Oracle when CI provides a schema or Docker. Local development can use Oracle Free in Docker.

## D-027 · One repository, one deployable on OpenShift (2026-10-04)

Every repository change touches the web app and the API together, so they live in one repository
and ship as one artifact: the Spring Boot jar carries the built web app and serves it next to
`/api` from the same origin. One image, one Helm release, one route — no CORS, no cross-site
cookies, no version drift between web app and API — built by one Jenkins pipeline that runs both
test suites and the contract test, pushes the image to Nexus and promotes the same image through
dev, test and prod. The web app is static and small, so serving it from the JVM (with long-lived
caching for hashed assets) costs nothing worth a separate web server; if the platform later
requires one, the same pipeline can build two images with one tag behind one host.

## B-004 · Demo sign-in and demo data only in the demo profiles (2026-10-03)

Development and demos need the same organisation and account picker as the frontend's demo, but
production must never have a login without the identity provider. Both are switched on by the
`local` and `h2` profiles only, demo data loads only into an empty database, and the application
refuses to start when the demo sign-in or a demo profile is combined with `prod`.

## B-003 · Attachment bytes in the database behind an interface (2026-10-03)

Files (≤ 20 MB) are stored in `attachment_contents` (a BLOB) so the API runs with nothing but the
database; `AttachmentContentStore` lets an object store take over without changing the API.
Downloads are always served as attachments with `nosniff`, and executables, scripts, HTML and SVG
are refused on upload.

## B-002 · REST resources mirror the frontend repositories one to one (2026-10-03)

The API is shaped after the frontend's repository contracts — same JSON, same error codes, fields
and Turkish messages — so the frontend switches from its mock to the API without touching a page.
The mock's rules were ported, and a contract test in the frontend runs every read and a write
scenario against both and compares them; that test, not reading the code, is how parity is kept.
Read models are built in Java from full tables (fine for hundreds of applications and projects);
moving a hot one to SQL is an optimisation behind the same endpoint.

## B-001 · Spring Boot backend, same-origin sessions (2026-10-03)

The frontend must not reach the database or integrations directly (credentials, server-side
authorisation, transactions, background jobs, file storage). A Java 21 / Spring Boot modular
monolith follows the organisation's backend standard. The browser keeps no tokens: the API holds
the OIDC session behind an httpOnly cookie on the same origin as the SPA, with cookie-based CSRF.
Privileges are a code-level catalogue mirrored from the frontend; roles and user–role assignments
are data.

## D-026 · One repository contract, two implementations, proven equal (2026-10-03)

The backend (Spring Boot, `backend/`) serves a REST resource for every repository method, and
`services/http/` implements every repository over it; `VITE_DATA_SOURCE=http` selects it, otherwise
the in-browser mock stays the demo and test backend. The REST shape follows the contracts
one-to-one (same JSON, same error codes and field names, same Turkish messages) so no page,
hook or test changed. Parity is not assumed but checked: `apiContract.test.ts` runs every read and a
write scenario against both implementations on the same demo data and compares the results. Reads
of portfolio data stay open to every signed-in account — pickers and cross-screen references need
them, and it is internal knowledge — while commercial data, user and role administration and files
follow their screen's `view` privilege; writes are always checked. Sessions are httpOnly cookies on
the same origin with CSRF protection, never tokens in the browser.

## D-025 · Contracts belong to projects; vendors are records; money is never converted (2026-10-03)

Purchases are tracked per project (one `projectId`), with related applications as links, because
the project is where budget and responsibility sit. Vendors are their own table (not free text) so
spend and contracts can be grouped per supplier. Amounts keep their contract currency; totals are
shown per currency instead of converting with a rate Cerebro does not own. Commercial terms get a
dedicated `contracts` privilege that also guards reads. Projects and vendors with contracts cannot
be deleted (contracts are records to keep), and the payment plan may not exceed the contract value.

## D-024 · Per-screen privileges in code, roles as data (2026-10-03)

Two fixed roles could not express business-unit users, managers or auditors. Privileges are now a
fixed, typed catalogue — one module per screen with `view`/`edit`/`delete` (each implying the lower)
— because code checks them and a typo must not compile; roles are administrable records that bundle
privileges, and users hold several roles (access = union). A screen-level matrix (no access /
read-only / edit / full) keeps role editing understandable instead of exposing a long checklist.
The system administrator role is locked and must stay with at least one active user so the system
is always administrable. The server resolves privileges into the session on every request. Row-level
rules (a requester's own demand) stay in domain modules on top of screen privileges. Read filtering
of portfolio data by `view` is enforced at route level in the mock and is a backend requirement.

## D-023 · Demands: one aggregate, WSJF scoring, requester rights by ownership (2026-10-03)

Business units need to raise requests themselves, so `user` accounts gain `demands:submit` — the
first write a non-admin may do. Rather than a third role, rights follow ownership: requesters
change, withdraw and attach files to their own demand until the portfolio office decides; only
`demands:manage` assesses, schedules and deletes. The rule lives in one pure module shared by the
repository and the UI. Request and assessment stay on one `demands` row (they share a lifecycle;
no separate assessment table), with status history in `demand_events`. Prioritisation uses WSJF
because it is explainable to requesters and needs only five 1–5 scores; the score suggests a
priority but the decided `priority` is a separate field. Scheduling is by quarter (shortcuts set
the dates), matching how the portfolio is planned; converting to a project links an existing
project instead of creating one.

## D-022 · Attachments: metadata in the database, bytes in object storage (2026-10-03)

Records need their documents, not just links: required ones (an application's architecture and
security assessment, a project's charter and go-live approval) and any reference material. One
polymorphic `attachments` table (one nullable foreign key per owner type, exactly one set) keeps
metadata and integrity; bytes go to object storage under the row id, never into the database —
mirrored in the mock by an IndexedDB `BlobStore`. Required documents are a per-record-type list of
`documentTypes` codes in code (system codes, so their labels stay editable); making the list
itself administrable is a later step. Only an allow-list of document/image/archive types up to
20 MB is accepted (no executables, scripts, HTML or SVG). Upload uses Takeoff `Upload`.

## D-021 · Own .xlsx writer on fflate instead of a spreadsheet library (2026-10-03)

Users want tables "as Excel, nicely formatted". CSV loses types and formatting and needs a BOM
trick for Turkish characters. Full spreadsheet libraries are heavy (ExcelJS) or have unpatched
advisories on npm (SheetJS). The export needs one narrow feature set — typed cells, a styled
header, frozen pane, auto-filter, widths, hyperlinks — so `lib/xlsx.ts` writes the XML parts and
zips them with `fflate` (~8 kB, loaded only when "Excel'e aktar" is clicked). Text is always an
inline string, never a formula. The CSV export of the data quality report was replaced and the CSV
helper removed. Validated by reading generated files with openpyxl.

## D-020 · Hand-built SVG charts over one trends read model (2026-10-02)

Takeoff UI has no charts. The reports need four forms only — monthly lines, stacked monthly
columns, horizontal distribution bars and a small matrix — so they are built as small SVG
components instead of adding a charting library: no dependency, token-driven theming (light and
dark steps chosen separately and validated for colour-vision deficiency), real tables for
assistive technology, and full control of the plan/actual distinction. All series come from one
`getTrends` call computed like a backend analytics endpoint would, so every chart on a tab
agrees. Escalations gained `resolvedOn` (set automatically when closed without a date) because
backlog and time-to-resolve cannot be derived otherwise. Closed history for the last year was
added to the seed so trends are meaningful. Dev storage key moved to `cerebro.demo-db.v8`.

## D-019 · Structured incident runbooks per application (2026-10-01)

Runbooks already appear as documentation links, but during an incident people need the content
itself, in the order it is used, not a link to a wiki page that may be stale. A runbook is a
structured record per application: first-response steps, addresses to check with what to look
for, contacts in escalation order (linked to people and teams so names, e-mails and channels stay
current), and known problems with symptoms and steps. Steps are edited as plain lines (fast to
write, stored as ordered rows). A "last verified" date makes staleness visible. Contact channels
and on-call lines are allowed; credentials are refused everywhere (`looksLikeSecret`). The
checklist state is deliberately not persisted — an incident log is a separate concern.

## D-018 · Resource planning with explicit allocations (2026-10-01)

Project roles say _who_ is involved, not _when_ or _how much_, so they cannot show parallel work.
Allocations are a separate entity (`resource_allocations`: person, project, role, dates, percent).
Overlaps across projects are allowed — showing and managing them is the point — and the planner
makes them visible two ways: lanes (a row is as tall as the most work done at once) and a daily
load strip (sum of percentages; red above 100 %). Over-allocation is warned about, not blocked:
it is a planning decision. Bars are positioned with CSS variables in a scrollable table rather
than a charting library — no dependency, keyboard and screen-reader friendly, and the list view is
the text alternative. Writes need the new `resources:manage` permission (admin). Dev storage key
moved to `cerebro.demo-db.v6`.

## D-017 · Person page from a single workload read model (2026-10-01)

"What does this person work on?" spans roles on applications and projects, team assignments,
risks, escalations, decisions and leaves. Instead of the page issuing a query per register and
joining in the browser, `PersonRepository.getWorkload` returns one `PersonWorkload` document
(an HTTP backend would serve it as one endpoint backed by joins). Team work is attributed through
the person's teams (`viaTeams`) separately from direct roles, so the page can say _how_ someone
is involved. The production build now splits vendor code (`vendor-takeoff`, `vendor-react`,
`vendor`) so library chunks cache across deploys and stay under the 500 kB warning.

## D-016 · Leave management as a person × day timeline (2026-09-27)

Leaves are their own entity (`leave_records`) referencing a person, with the type drawn from a new
colourable master data list (`leaveTypes`), so admins can add types and pick colours without code.
The calendar is a semantic table rather than a canvas or chart library: people are row headers,
days are column headers, and each leave is one cell spanning its days, which keeps it readable by
screen readers and needs no new dependency. Three zoom levels (2 weeks, month, 3 months) trade
label detail for range; the list view is the text alternative. Overlapping leaves for the same
person are rejected (repository today, exclusion constraint in PostgreSQL). Reading is open to all
signed-in users; writing needs the new `leaves:manage` permission (admin). Dev storage key moved to
`cerebro.demo-db.v5`.

## D-015 · Numeric sequence primary keys, database-shaped model (2026-09-27)

Every entity and child row has `id: number` from its table's own sequence (`BIGINT GENERATED BY
DEFAULT AS IDENTITY`), replacing slug ids like `app-payment-gateway`. Child rows that the UI edits
inside an aggregate (environments, repositories, data stores, technology usages, documentation
links, milestones, application impacts, role and team assignments) are separate tables with their
own ids; write requests send `Draft<T>` rows with `id: null` for new rows, and the server assigns
`nextval`, keeping stored ids and refusing ids that belong to another record. Many-to-many links
(team members, decision makers, related applications/projects) are link tables. Master data items
have ids too; records keep referencing their stable `code`, checked by composite foreign keys.
Ids are unique per table, so code must never mix ids of different tables in one map or key.
URLs use the numeric id; malformed ids resolve to "not found". The mock database keeps one
sequence per table (`SEQUENCES`); seed rows are named in `services/mock/data/ids.ts`. The full
PostgreSQL schema is `docs/database-schema.sql` (verified with an embedded PostgreSQL; superseded by
D-028 — Oracle migrations in `backend/`, master data codes checked by the services). Dev
storage keys moved to `cerebro.demo-db.v4` and `cerebro.demo-session.v2`.

## D-014 · Enumerated values are administrable master data (2026-09-26)

Labels, descriptions, badge colours, order and active flags of every enumerated value (28 lists:
lifecycles, statuses, types, categories, scales…) live in a `masterData` store edited at
`/admin/master-data`, together with business units and people. Records keep storing stable codes.
Lists that drive logic (workflow statuses, criticality scale, lifecycle) are **fixed**: admins may
rename/recolour/reorder but not add or remove. Other lists are **extensible**: admins add their own
values; their TypeScript type widens to `string`. Codes the logic depends on are `systemCodes` and
can never be deleted or deactivated. Custom values in use can only be deactivated — inactive values
stay readable on records and in edit forms but are not offered for new input. Writes are validated
server-side against the lists (`assertCodeChecks`). The UI reads the lists once per session via
`MasterDataProvider` (synchronous `useMasterData()`); saving invalidates the query so changes appear
everywhere immediately. Permission: `masterData:manage` (admin). Dev storage key: `cerebro.demo-db.v3`.

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
