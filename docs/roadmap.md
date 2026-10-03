# Cerebro — Roadmap

Status as of 26 Sep 2026.

## Phase 0 — Foundation ✅

Repository setup, Takeoff UI v2 integration, project Skills, `CLAUDE.md`, `AGENTS.md`,
architecture docs, core domain types for all MVP entities, repository abstraction with mock
implementation, realistic connected seed data, app shell, routing, base page patterns.

## Phase 1 — Core Inventory ✅

| Item                                                                                                    | Status |
| ------------------------------------------------------------------------------------------------------- | ------ |
| Applications list + detail (10 tabs)                                                                    | ✅     |
| Projects list + detail (8 tabs incl. milestones, decisions, financials)                                 | ✅     |
| Dashboard (key figures, needs attention, recently updated, lifecycle distribution, upcoming milestones) | ✅     |
| Global search (links to applications, projects, teams, technologies)                                    | ✅     |
| Create / Edit for every entity (React Hook Form + Zod, unsaved-changes guard, deletion impact)          | ✅     |
| Roles and per-screen privileges (view/edit/delete), administrable roles, enforced in the repository     | ✅     |
| Master data administration (28 value lists, business units, people)                                     | ✅     |
| Turkish user interface and demo data                                                                    | ✅     |

Next: corporate SSO (OIDC) instead of the demo sign-in; a real backend implementing the repository
interfaces; person and business unit detail pages.

## Phase 2 — Organisational Context (read views ✅)

Teams list + detail (owned applications, delivered projects, members), Technologies catalogue +
where-used detail. People and business units are administered as master data. Person pages ✅, resource planning ✅
(`/people/:id`: everything a person is mapped to). Still open: business unit detail pages.

## Phase 3 — Operational Knowledge (read views ✅)

Risks and escalations registers with filters; decisions (ADR) per project; milestones.
Create/edit for risks, escalations and decisions ✅. Still open: a portfolio-wide decision log.

## Phase 4 — Connections (structured view ✅)

Impact analysis (transitive downstream/upstream with weakest-link criticality), dependency and
integration registers. Still open: graph visualisation (evaluate a library over the edge model).

## Phase 5 — Governance (reports ✅)

Data-quality report (completeness, ownership gaps, review state, Excel export) and technology-risk
report. Still open: review reminders, lifecycle governance workflows, field-level audit history.

## Phase 6 — Enterprise Integrations

SSO, Jira, Confluence, Git hosting, CI/CD, monitoring, service catalogue. Not started by design.

## Technical follow-ups

- Split the vendor bundle (main chunk ≈ 780 kB / 232 kB gzip) once real usage patterns are known.
- Authentication shell (OIDC) and a permission model mirrored from the backend.
- `services/http` implementation when a backend is chosen.
