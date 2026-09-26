# Cerebro — Domain Model

Types live in `src/domains/<domain>/types/index.ts`. This document explains the entities and,
more importantly, the relationships between them.

## Relationship map

```text
BusinessUnit ◄── businessUnitId ── Application ──── roles[] ────► Person
      ▲                              │  │  │
      │                              │  │  └── teams[] (responsibility) ──► Team ──► Person (manager, members)
      │                              │  └── technologies[] (layer, version) ──► Technology
      │                              └── embedded: environments, repositories, dataStores, documentation
      │
      └── businessUnitId ── Project ── applicationImpacts[] (creates|modifies|integrates-with|decommissions) ──► Application
                              │  └── roles[], teams[], embedded: milestones, documentation, financials?
                              │
ApplicationDependency: source Application ── depends on ──► target Application   (type, criticality)
Integration:           from Application ── calls/produces ──► to Application | external party (type, frequency)

Risk / Escalation / Decision ── relatedApplicationIds[], relatedProjectIds[] ──► Application, Project
```

## Core rules

1. **References are ids.** Never names. Names are resolved via lookups or read models.
2. **Roles are contextual** (`RoleAssignment { personId, role }` on applications and projects). A
   person can be technical owner of one application and stakeholder on another.
3. **Team assignments carry a responsibility** (`development`, `support`, `operations`,
   `delivery`), so "who builds it" and "who supports it" are distinguishable.
4. **Aggregates own value objects** with stable ids: environments, source repositories, data
   stores, documentation links (application); milestones, impacts (project).
5. **Relationships between aggregates are entities** (`ApplicationDependency`, `Integration`) so
   they can carry metadata and be queried in both directions.
6. **Every aggregate carries `AuditMetadata`** (`created*`, `updated*`, `lastReviewed*`).
7. **No secrets** anywhere in the model.

## Entities

### Application

Identity (`code`, `name`), descriptions, `businessPurpose`; classification (`type`, `lifecycle`,
`criticality`, `operationalStatus`, `tags`); business context (`businessUnitId`,
`businessProcesses`, `userGroups`, `estimatedUserCount`); ownership (`roles`, `teams`);
technical context (`technologies`, `dataStores`, `hosting`); `repositories`, `environments`,
`documentation`; `audit`.

- `lifecycle`: planned → development → active → maintenance → deprecated → retired.
- `operationalStatus` (operational / degraded / outage / not-deployed) is independent of lifecycle.
- Read model `ApplicationListItem` adds resolved `businessUnit`, `technicalOwner`, `teams`.

### Project

Identity, objective/scope/out-of-scope; classification (`type`, `priority`, `status`, `health`,
`confidentiality`); organisation (`businessUnitId`, `roles`, `teams`); `timeline`,
`progressPercentage`, `currentPhase`, status summary and next steps; optional `financials`
(isolated so an API can omit it for unauthorised viewers); `applicationImpacts`, `milestones`,
`documentation`; `audit`.

### ApplicationDependency

`sourceApplicationId` **depends on** `targetApplicationId`. `type` (runtime, authentication, data,
messaging, batch, build), `criticality` (impact on the source if the target is unavailable),
`description`. For an application: _outgoing_ = "depends on", _incoming_ = "used by".

### Integration

A concrete interface. `fromApplicationId` initiates/produces; the receiver is `toApplicationId`
or an `externalPartyName`. `type` (REST, SOAP, GraphQL, Kafka, RabbitMQ, database, file transfer,
batch, event), `frequency`, `dataExchanged`. For an application: _outbound_ = from, _inbound_ = to.

### Team, Person, BusinessUnit, Technology

Reference data. `Team` has `managerId`, `memberIds`, shared contact channels and
responsibilities. `Person` has job title, email, business unit, location. `Technology` has
`category` and an organisational `status` (preferred, supported, deprecated, retired) which lets
Cerebro answer "which systems still use deprecated technology?".

### Risk, Escalation, Decision

Operational knowledge linked many-to-many to applications and projects. Risks carry probability,
impact, severity, status (open, monitoring, mitigated, accepted, closed), owner, mitigation and
due date. Escalations carry severity, status, owner, responsible team, raiser, target date and
resolution. Decisions are lightweight ADRs (context, decision, rationale, alternatives,
consequences, deciders, status).

### Not (yet) separate entities

- **Database** → `DataStore` embedded in the application (technology-typed).
- **API** → `Integration` with an API type.
- **Contact** → `RoleAssignment` + team contact channels.
- **Tag** → lowercase slug strings.

Promote any of these to an aggregate when it needs its own ownership, lifecycle or page; record
the decision in `decisions.md`.

## Data quality

- **Completeness** (`domains/governance`): configurable rules (`id`, `label`, `description`,
  `importance`, `weight`, `appliesTo`, `isSatisfied`). Required rules weigh 3, recommended 1.
  Rules that do not apply (e.g. repositories for vendor-hosted SaaS) are excluded from the
  score. The UI always lists the missing rules next to the percentage.
- **Staleness**: `lastReviewedAt` older than 180 days (`REVIEW_INTERVAL_DAYS`) or never reviewed
  → "information may be out of date" notice.

Current application rules: technical owner, business owner, business unit, description & purpose,
responsible team (required); technologies, source repository, production environment,
documentation (recommended). Dependency coverage is a candidate rule once dependency data is
loaded alongside the application.

## Graph readiness

Dependencies, integrations, project impacts and team assignments map directly to graph edges
(`depends_on`, `communicates_with`, `modifies`, `owns`) with applications, projects, teams and
external parties as nodes. No graph library is used yet (Phase 4).

## AI readiness

Questions such as "which critical applications depend on Payment Gateway?" or "who owns Customer
Identity Platform?" are answerable by structured queries over this model — no information that
such questions need is stored only in free text.
