# Backend

`backend/` is a Spring Boot application with two jobs: the REST API behind every screen, and
serving the built web app (`frontend/dist`, packed into `classpath:/static`) from the same origin.
It owns the database, the sessions and every access decision.

```text
Browser ── HTTPS (OpenShift route) ──► cerebro pod (Spring Boot)
                                        ├─ /, /projects/12, /assets/…    web app (index.html fallback)
                                        ├─ /api/**                       REST API (session cookie + CSRF)
                                        ├─ /oauth2/**, /login/oauth2/**  Oracle Access Manager (OIDC)
                                        └─ /actuator/health/**           probes
                                              │
                                              └─► Oracle 19c+ (schema, sessions, attachment bytes)
```

## Packages

```text
com.cerebro.api
  security/      SSO login, demo sign-in, CSRF, CSP, session cookie, web app serving
  access/        current user, privileges, /api/auth
  admin/         users and roles
  masterdata/    value lists, code checks
  organisation/  business units, people (+ workload), teams
  technologies/  catalogue
  portfolio/     roles, teams and links shared by applications and projects
  applications/  projects/  connections/
  operations/    risks, escalations, decisions
  planning/      leaves, resource allocations
  runbooks/      attachments/ (bytes: AttachmentContentStore)
  demands/       contracts/ (and vendors)
  governance/    dashboard, health report, trends
  search/        demo/ (demo data, demo profiles only)
  shared/        errors, audit, SQL helpers, text rules, Turkish collation
```

A modular monolith: one deployable, one database, one package per domain. Each package has records
for its JSON (the frontend types, one to one, with a nested `Input` for writes), a service that
holds the rules and talks SQL through `JdbcClient`, and a `@RestController` that only maps HTTP.
Larger aggregates (applications, projects) keep their SQL in a `…Store`. The rules come from the
frontend's mock repositories (`frontend/src/services/mock`), which stay the executable
specification; the contract test keeps the two equal.

- **Validation** — required text, lengths, dates, references (`Checks.assertRefs`), case- and
  Turkish-insensitive uniqueness (`Checks.assertUnique`), master data codes (`MasterCodes`:
  inactive values are allowed only when the record already had them), the "no credentials" rule
  (`Texts.looksLikeSecret`). Errors are `ValidationException(message, field)`, in Turkish.
- **Child rows** (environments, milestones, payments…) are replaced as a set (`ChildRows`): stored
  rows keep their id, new rows take the next identity value, ids owned by another record are
  refused.
- **Audit** — `AuditStamp` sets created/updated/reviewed with the acting person; saving through a
  form counts as a review.
- **Deletion** — `GET …/deletion-impact` lists what goes with the record and may block it; the
  delete then relies on the foreign keys (`ON DELETE CASCADE / SET NULL`, otherwise restricted).
- **Read models** (lists, workload, dashboard, trends) are assembled in Java from the tables, with
  the same sorting (Turkish collation, `Collation`) and rules as the frontend.

## API conventions

- Resources follow the repository contracts: `/api/<resource>` (`GET` list, `POST` create),
  `/api/<resource>/{id}` (`GET`, `PUT`, `DELETE`), `/api/<resource>/{id}/deletion-impact`, and read
  models at their own paths (`/api/applications/{id}/dependencies`,
  `/api/people/{id}/workload?today=`, `/api/governance/trends`, `/api/demands/{id}/assessment`…).
  OpenAPI: `/v3/api-docs` (Swagger UI outside production).
- JSON matches the frontend types field for field; dates are `yyyy-MM-dd`, timestamps UTC with
  milliseconds (`2026-03-14T09:30:00.000Z`).
- Errors are RFC 9457 problem details whose `code` is `validation`, `not-found`, `forbidden` or
  `unauthenticated`, with `field` for validation; messages are Turkish and user-facing.
- Writes send the `XSRF-TOKEN` cookie value back in the `X-XSRF-TOKEN` header.

## Access control

- **Privileges** are a fixed catalogue: one module per screen with `view` / `edit` / `delete`
  (each implying the lower). `PrivilegeModule` (Java), the frontend's `PRIVILEGE_MODULES` and the
  `access_privileges` table (V2, generated from the frontend) must match; `PrivilegeCatalogTest`
  checks Java against the migration.
- **Roles** bundle privileges and are administrable; **users** hold several roles; access is the
  union, resolved once per request so role changes apply immediately.
- **Every API call needs an active account** (`SignedInInterceptor`; an SSO identity alone is not
  enough). **Every write checks its screen privilege**. Reads of portfolio data are open to any
  signed-in account (forms pick people, teams and applications everywhere); contracts and vendors
  need `contracts:view`, users and roles `users:view` / `roles:view`, attachments the `view`
  privilege of their record's screen; search returns only the kinds the user may view.
- **Identity** — production: Oracle Access Manager over OIDC (`/oauth2/authorization/corporate`).
  The claim in `CEREBRO_OIDC_USER_CLAIM` (default `email`) must match an active `user_accounts`
  email, otherwise 401. Demo profiles (`local`, `h2`): the demo sign-in picks an account; they
  refuse to start together with `prod`. Cerebro never stores passwords.
- **Sessions** are in the database (Spring Session JDBC), so any pod serves any user and rolling
  deploys sign nobody out. The cookie is `SESSION`: httpOnly, Secure, SameSite=Lax.
- **Browser hardening** — Content-Security-Policy (scripts only from the app's origin), frame
  denial, `nosniff`, same-origin referrer; downloads are always attachments.

## Database (Oracle)

- Flyway migrations in `src/main/resources/db/migration`: `V1` schema, `V2` privilege catalogue and
  system role, `V3` master data (both generated from the frontend), `V4` session tables. Schema
  changes are new migrations, never edits of applied ones.
- Written for **Oracle 19c**: identity columns, `NUMBER(1)` booleans, string lists as JSON in
  `CLOB`, `VARCHAR2(n CHAR)`, named constraints and indexes, no 23ai-only syntax.
- Oracle stores `''` as NULL: optional text columns are nullable and read back as `""`
  (`Sql.text`); required text is `NOT NULL`.
- Overlap rules (one leave per person and day, one allocation per person, project and day) are
  checked by the service while holding a row lock on the person (`SELECT … FOR UPDATE`).
- Demo data (`demo/demo-data.json`) is generated from the frontend seed
  (`npm run generate:backend-seed`) and loaded with bound parameters into an empty database in the
  demo profiles; identities then continue after it.

## Profiles and configuration

| Profile | Database                              | Sign-in        | Demo data |
| ------- | ------------------------------------- | -------------- | --------- |
| `h2`    | H2 in Oracle mode, in memory          | account picker | yes       |
| `local` | Oracle Free from `docker-compose.yml` | account picker | yes       |
| `prod`  | Oracle (environment)                  | OAM (OIDC)     | no        |

| Variable                                    | Purpose                                                 |
| ------------------------------------------- | ------------------------------------------------------- |
| `CEREBRO_DB_URL`                            | `jdbc:oracle:thin:@//host:1521/SERVICE`                 |
| `CEREBRO_DB_USER` / `CEREBRO_DB_PASSWORD`   | Schema owner (Secret)                                   |
| `CEREBRO_DB_POOL_SIZE`                      | Connections per pod (default 10)                        |
| `CEREBRO_OIDC_ISSUER_URI`                   | OAM OIDC issuer (discovery under `/.well-known/…`)      |
| `CEREBRO_OIDC_CLIENT_ID` / `_CLIENT_SECRET` | OAM client registration (Secret)                        |
| `CEREBRO_OIDC_USER_CLAIM`                   | Claim matched to the account email (default `email`)    |
| `CEREBRO_BOOTSTRAP_ADMIN_EMAIL`             | First deployment: gets the system role if nobody has it |
| `CEREBRO_TIME_ZONE`                         | The organisation's "today" (default `Europe/Istanbul`)  |

## Tests

- Unit tests for the shared rules (text, collation, privileges, file names, trends).
- `ApiIntegrationTest`: the whole API with the demo data — sign-in, session cookie, privileges,
  CSRF, validation, a write round trip. It runs on an Oracle schema from `CEREBRO_TEST_DB_URL`
  (+ `_USER`, `_PASSWORD`), else on Oracle XE 21 in Docker (Testcontainers), else on H2 in Oracle
  mode — so it always runs.
- The frontend's contract test against a running API (`h2` profile) compares every read and a
  write scenario with the mock.

## Changing a module

1. Change the frontend contract, its mock, its HTTP implementation and the API in one change.
2. Port new rules with their Turkish messages and fields; add a migration for schema changes
   (19c syntax).
3. `./mvnw verify`, `npm run validate`, then the contract test against a freshly started API.
