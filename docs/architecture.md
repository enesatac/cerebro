# Architecture

```text
Browser (Cerebro SPA) ── same origin, httpOnly session cookie ──► cerebro-api
                                                                  ├─ security/   SSO login, sessions, CSRF
                                                                  ├─ access/     privileges, roles, current user
                                                                  ├─ shared/     error format, common types
                                                                  └─ <module>/   one package per domain (to come)
                                                                        │
                                              PostgreSQL ◄──────────────┤  (Flyway migrations)
                                              Object storage ◄──────────┤  (attachments, later)
                                              Integrations ◄────────────┘  (HR, CMDB, e-mail…, later)
```

A modular monolith: one deployable, one database, one package per domain. No microservices —
Cerebro's size does not need them.

## Access control

- **Privileges** are a fixed catalogue: one module per screen with `view` / `edit` / `delete`
  (each implying the lower). `PrivilegeModule` (Java), the frontend's `PRIVILEGE_MODULES` and the
  `privileges` table (seeded by `V2`) must match; `PrivilegeCatalogTest` checks Java against the
  migration.
- **Roles** bundle privileges and are administrable; **users** hold several roles; access is the
  union. `AccountRepository` resolves it on every request, so role changes apply immediately.
- **Every endpoint checks its privilege** — writes *and* reads of restricted data (contracts,
  users, project financials): `@PreAuthorize("@access.has('projects:edit')")` or
  `access.require("contracts:view")`. The frontend only hides what would be refused.
- **Identity:** corporate OIDC (`prod`); the SSO email must match an active `user_accounts` row,
  otherwise 401. Cerebro never stores passwords.

## Database

- `V1__schema.sql` is the frontend's `docs/database-schema.sql` at the time of the split. From
  now on schema changes are new migrations here (`V4__…`), never edits of applied ones.
- `V2` seeds the privilege catalogue and the locked system administrator role; `V3` the shipped
  master data values (both generated from the frontend sources).
- Child rows of an aggregate are sent with `id: null` when new; the server assigns ids.

## Adding a module (e.g. applications)

1. Package `com.cerebro.api.applications`: records for the read models and inputs, a repository
   (JdbcClient), a service holding the rules, a `@RestController` under `/api/applications`.
2. Port the rules from `cerebro/src/services/mock/Mock<Entity>Repository.ts` and its tests:
   validation messages (Turkish, with the field), master-data code checks, deletion impact and
   cascades, audit columns.
3. Check the screen privilege on every endpoint; return problem details through the shared
   exceptions (`ValidationException`, `NotFoundException`, `ForbiddenException`).
4. Integration tests with Testcontainers; the frontend gets an `HttpApplicationRepository`.
