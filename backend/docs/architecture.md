# Architecture

```text
Browser (Cerebro SPA) ── same origin, httpOnly session cookie ──► cerebro-api
                                                                  ├─ security/       SSO login, demo sign-in, CSRF
                                                                  ├─ access/         current user, privileges, /api/auth
                                                                  ├─ admin/          users and roles
                                                                  ├─ masterdata/     value lists, code checks
                                                                  ├─ organisation/   business units, people (+ workload), teams
                                                                  ├─ technologies/   catalogue
                                                                  ├─ portfolio/      roles, teams, links shared by apps and projects
                                                                  ├─ applications/   ├─ projects/   ├─ connections/
                                                                  ├─ operations/     risks, escalations, decisions
                                                                  ├─ planning/       leaves, resource allocations
                                                                  ├─ runbooks/       ├─ attachments/  (bytes: AttachmentContentStore)
                                                                  ├─ demands/        ├─ contracts/    (and vendors)
                                                                  ├─ governance/     dashboard, health report, trends
                                                                  ├─ search/         ├─ demo/        demo data (local)
                                                                  └─ shared/         errors, audit, SQL helpers, text rules
                                                                        │
                                              PostgreSQL ◄──────────────┤  (Flyway migrations)
                                              Integrations ◄────────────┘  (HR, CMDB, e-mail…, later)
```

A modular monolith: one deployable, one database, one package per domain. No microservices —
Cerebro's size does not need them.

## A module

Each package has records for its JSON (the frontend types, one to one, with a nested `Input` for
writes), a service that holds the rules and talks SQL through `JdbcClient`, and a
`@RestController` that only maps HTTP. Larger aggregates (applications, projects) keep their SQL in
a `…Store`. The rules are ported from the frontend's mock repositories
(`cerebro/src/services/mock`), which stay the executable specification:

- **Validation** — required text, lengths, dates, references (`Checks.assertRefs`), case- and
  Turkish-insensitive uniqueness (`Checks.assertUnique`), master data codes (`MasterCodes`:
  inactive values are allowed only when the record already had them), the "no credentials" rule
  (`Texts.looksLikeSecret`). Errors are `ValidationException(message, field)`, in Turkish.
- **Child rows** (environments, milestones, payments…) are replaced as a set (`ChildRows`): stored
  rows keep their id, new rows (`id: null`) take the next value of the table's sequence, ids owned
  by another record are refused.
- **Audit** — `AuditStamp` sets created/updated/reviewed with the acting person; saving through a
  form counts as a review.
- **Deletion** — `GET …/deletion-impact` lists what goes with the record and may block it; the
  delete then relies on the foreign keys (`ON DELETE CASCADE / SET NULL / RESTRICT`).
- **Read models** (lists, workload, dashboard, trends) are assembled in Java from the tables, with
  the same sorting (Turkish collation, `Collation`) and rules as the frontend.

## Access control

- **Privileges** are a fixed catalogue: one module per screen with `view` / `edit` / `delete`
  (each implying the lower). `PrivilegeModule` (Java), the frontend's `PRIVILEGE_MODULES` and the
  `privileges` table (seeded by `V2`) must match; `PrivilegeCatalogTest` checks Java against the
  migration.
- **Roles** bundle privileges and are administrable; **users** hold several roles; access is the
  union. `AccountRepository` resolves it once per request, so role changes apply immediately.
- **Every API call needs an active account** (`SignedInInterceptor`; an SSO identity alone is not
  enough). **Every write checks its screen privilege** (`access.require("projects:edit")`). Reads
  of portfolio data are open to any signed-in account (forms pick people, teams and applications
  everywhere); contracts and vendors need `contracts:view`, users and roles `users:view` /
  `roles:view`, attachments the `view` privilege of their record's screen, search returns only the
  kinds the user may view. The frontend applies the same rules and only hides what is refused.
- **Identity:** corporate OIDC (`prod`, `/oauth2/authorization/corporate`); the SSO email must match
  an active `user_accounts` row, otherwise 401. Locally the demo sign-in
  (`POST /api/auth/sign-in`) picks an account. Cerebro never stores passwords.

## Database

- `V1__schema.sql` is the frontend's `docs/database-schema.sql` at the time of the split; schema
  changes are new migrations (`V4…`), never edits of applied ones. The frontend's schema document is
  kept in step.
- `V2` seeds the privilege catalogue and the locked system administrator role; `V3` the shipped
  master data values; `V4` adds attachment bytes; `V5` keeps the order of link rows.
- `demo/demo-data.sql` and `master-data-catalog.json` are generated from the frontend sources (the
  demo organisation and the list rules); regenerate them when those change.

## Changing a module

1. Change the frontend contract, its mock and its HTTP implementation, and the API together.
2. Port new rules with their Turkish messages and fields; add a migration for schema changes.
3. Run `./mvnw verify`, then the frontend's contract test against a freshly started API
   (`CEREBRO_API_URL=http://localhost:8080 npx vitest run src/services/http/apiContract.test.ts`).
