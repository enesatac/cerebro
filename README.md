# cerebro-api

Backend of [Cerebro](https://github.com/enesatac/cerebro), the internal portfolio app
(applications, projects, demands, contracts, people and their access). The frontend talks only
to this API; the API owns the database, the integrations and every access decision.

**Status: skeleton.** The foundations are in place — database schema, access control, sessions,
error format, OpenAPI, Docker, CI — and the business modules (applications, projects, …) are
added on top of them one by one. The frontend's in-memory repositories
(`cerebro/src/services/mock`) are the behavioural specification for each module.

## Stack

Java 21 · Spring Boot 4.1 (Web MVC, Security, OAuth2 client, JDBC) · PostgreSQL 17 · Flyway ·
springdoc-openapi · JUnit 5 + Testcontainers · Maven (wrapper included).

## Run locally

Requirements: JDK 21 and Docker.

```bash
docker compose up -d          # PostgreSQL on localhost:5432
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

- API: <http://localhost:8080/api/session>
- OpenAPI: <http://localhost:8080/v3/api-docs> · Swagger UI: <http://localhost:8080/swagger-ui.html>
- Health: <http://localhost:8080/actuator/health>

The `local` profile has no identity provider: every request runs as `gelistirici@cerebro.local`,
which is created with the system administrator role on first start. The profile refuses to start
together with `prod`.

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

## Commands

```bash
./mvnw verify                  # compile + tests (the PostgreSQL test needs Docker)
./mvnw package                 # target/cerebro-api-*.jar
docker build -t cerebro-api .  # container image (runs with the prod profile)
```

## Connecting the frontend

1. Serve both under one origin (reverse proxy, or Vite's dev proxy `"/api" → http://localhost:8080`),
   so the session cookie and CSRF token work without CORS.
2. Implement `Http*Repository` classes for the repository interfaces and return them from
   `createRepositories()` (`cerebro/src/services/repositories.ts`). Pages do not change.
3. Errors: the API answers with problem details whose `code` is `validation`, `not-found`,
   `forbidden` or `unauthenticated` (and `field` for validation) — map them to the frontend's
   `ValidationError`, `NotFoundError`, `ForbiddenError`, `UnauthenticatedError`.
4. Writes send the `XSRF-TOKEN` cookie value back in the `X-XSRF-TOKEN` header.

See [`docs/architecture.md`](docs/architecture.md) for the design and how to add a module.
