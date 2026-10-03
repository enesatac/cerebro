# Decision log

## B-001 · Separate Spring Boot backend, same-origin sessions (2026-10-03)

The frontend must not reach the database or integrations directly (credentials, server-side
authorisation, transactions, background jobs, file storage). A separate repository with a Java
21 / Spring Boot modular monolith was chosen to follow the organisation's backend standard. The
browser keeps no tokens: the API holds the OIDC session behind an httpOnly cookie on the same
origin as the SPA, with cookie-based CSRF. Privileges are a code-level catalogue mirrored from the
frontend; roles and user–role assignments are data.
