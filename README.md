# cerebro-api

Backend of [Cerebro](https://github.com/enesatac/cerebro), the internal portfolio app
(applications, projects, demands, contracts, people and their access). The frontend talks only
to this API; the API owns the database, the integrations and every access decision.

Every screen of the app is served: a REST endpoint for each method of the frontend's repository
contracts (`cerebro/src/domains/*/api/*Repository.ts`) — portfolio, connections, risks /
escalations / decisions, demands, contracts and vendors, people and teams, technologies, leaves,
resource allocations, runbooks, attachments (with file storage), master data, users and roles,
the dashboard and report aggregates, and global search. The frontend's contract test runs the
same reads and writes against this API and its in-memory mock and checks they agree.

## Stack

Java 21 · Spring Boot 4.1 (Web MVC, Security, OAuth2 client, JDBC) · PostgreSQL 17 · Flyway ·
springdoc-openapi · JUnit 5 + Testcontainers · Maven (wrapper included).

## Run locally

Requirements: JDK 21 and Docker.

```bash
docker compose up -d          # PostgreSQL on localhost:5432
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Then start the frontend against it (in the cerebro repo): `npm run dev:api` →
<http://localhost:5173>.

- OpenAPI: <http://localhost:8080/v3/api-docs> · Swagger UI: <http://localhost:8080/swagger-ui.html>
- Health: <http://localhost:8080/actuator/health>

The `local` profile has no identity provider. It fills an **empty** database with the demo
organisation (`cerebro.demo-data`, the same fictional data as the frontend's demo) and turns on the
**demo sign-in**: the sign-in screen lists the active accounts and you continue as one of them
(`cerebro.security.demo-sign-in`). `gelistirici@cerebro.local` gets the system administrator role
if nobody holds it. The demo sign-in refuses to start together with `prod`.

To start over, drop the database volume (`docker compose down -v`).

## Configuration (production)

Profile `prod`; all values from the environment or the secrets manager — never from the repo.

| Variable                         | Purpose                                                    |
| -------------------------------- | ---------------------------------------------------------- |
| `CEREBRO_DB_URL`                 | JDBC URL, e.g. `jdbc:postgresql://db:5432/cerebro`         |
| `CEREBRO_DB_USER` / `_PASSWORD`  | Database account                                           |
| `CEREBRO_OIDC_ISSUER_URI`        | Corporate identity provider (OIDC issuer)                  |
| `CEREBRO_OIDC_CLIENT_ID`         | OIDC client                                                |
| `CEREBRO_OIDC_CLIENT_SECRET`     | OIDC client secret                                         |
| `CEREBRO_BOOTSTRAP_ADMIN_EMAIL`  | First deployment: gets the system role if nobody has it    |
| `CEREBRO_TIME_ZONE`              | The organisation's "today" (default `Europe/Istanbul`)     |

## Commands

```bash
./mvnw verify                  # compile + tests (the API integration test needs Docker)
./mvnw package                 # target/cerebro-api-*.jar
docker build -t cerebro-api .  # container image (runs with the prod profile)
```

Without Docker, the integration test can use an already migrated PostgreSQL:
`CEREBRO_TEST_DB_URL=jdbc:postgresql://localhost:5432/cerebro_test ./mvnw verify` (empty
database; the demo data is loaded on start).

## API conventions

- Resources follow the repository contracts: `/api/<resource>` (`GET` list, `POST` create),
  `/api/<resource>/{id}` (`GET`, `PUT`, `DELETE`), `/api/<resource>/{id}/deletion-impact`, and read
  models at their own paths (`/api/applications/{id}/dependencies`,
  `/api/people/{id}/workload?today=`, `/api/governance/trends`, `/api/demands/{id}/assessment`…).
- JSON matches the frontend types field for field; dates are `yyyy-MM-dd`, timestamps UTC with
  milliseconds (`2026-03-14T09:30:00.000Z`).
- Errors are problem details whose `code` is `validation`, `not-found`, `forbidden` or
  `unauthenticated`, with `field` for validation — the frontend maps them to its error classes.
  Messages are Turkish and user-facing.
- Same origin as the SPA (reverse proxy, or Vite's dev proxy): httpOnly session cookie, and writes
  send the `XSRF-TOKEN` cookie value back in the `X-XSRF-TOKEN` header.

See [`docs/architecture.md`](docs/architecture.md) for the design and how to change a module.
