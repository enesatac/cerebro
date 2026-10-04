# Decision log

## B-001 · Separate Spring Boot backend, same-origin sessions (2026-10-03)

The frontend must not reach the database or integrations directly (credentials, server-side
authorisation, transactions, background jobs, file storage). A separate repository with a Java
21 / Spring Boot modular monolith was chosen to follow the organisation's backend standard. The
browser keeps no tokens: the API holds the OIDC session behind an httpOnly cookie on the same
origin as the SPA, with cookie-based CSRF. Privileges are a code-level catalogue mirrored from the
frontend; roles and user–role assignments are data.

## B-002 · REST resources mirror the frontend repositories one to one (2026-10-03)

The API is shaped after the frontend's repository contracts — same JSON, same error codes, fields
and Turkish messages — so the frontend switches from its mock to the API without touching a page.
The mock's rules were ported, and a contract test in the frontend runs every read and a write
scenario against both and compares them; that test, not reading the code, is how parity is kept.
Read models are built in Java from full tables (fine for hundreds of applications and projects);
moving a hot one to SQL is an optimisation behind the same endpoint.

## B-003 · Attachment bytes in PostgreSQL behind an interface (2026-10-03)

Files (≤ 20 MB) are stored in `attachment_contents` so the API runs with nothing but PostgreSQL;
`AttachmentContentStore` lets an object store take over without changing the API. Downloads are
always served as attachments with `nosniff`, and executables, scripts, HTML and SVG are refused on
upload.

## B-004 · Demo sign-in and demo data only in the local profile (2026-10-03)

Development and demos need the same organisation and account picker as the frontend's demo, but
production must never have a login without the identity provider. Both are switched on by the
`local` profile only, demo data loads only into an empty database, and the application refuses to
start when the demo sign-in or `local` is combined with `prod`.
