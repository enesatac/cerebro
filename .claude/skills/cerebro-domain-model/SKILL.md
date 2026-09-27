---
name: cerebro-domain-model
description: Cerebro domain terminology, entities, relationships and modelling rules (applications, projects, teams, people, roles, technologies, dependencies, integrations, risks, escalations, decisions, audit metadata, completeness). Activate when adding or changing entity types or fields, modelling a relationship, writing mock/seed data, designing repository queries or read models, or answering "where does this data belong?".
---

# Cerebro Domain Model

Full reference: `docs/domain-model.md`. Types live in `src/domains/<domain>/types/`.

## 1. Modelling rules

1. **Relationships are ids, never names.** `businessUnitId: BU.digitalChannels` (a numeric key), not
   `businessUnit: 'Digital Channels'`. Resolve names through lookups or read models.
2. **Roles are contextual.** A person is not globally a "Technical Owner". Applications and
   projects hold `roles: RoleAssignment[]` (`{ personId, role }`). Use the helpers in
   `domains/shared/utils/roles.ts` (`findRoleHolders`, `findPrimaryRoleHolder`).
3. **Teams are assigned with a responsibility**: `teams: TeamAssignment[]`
   (`{ teamId, responsibility: 'development' | 'support' | 'operations' | 'delivery' }`).
4. **Aggregates own their value objects.** Environments, source repositories, data stores and
   documentation links are embedded in their application; milestones and application impacts in
   their project; role and team assignments in both. Each is a child table with its own sequence
   and `id`; write requests carry `Draft<T>` rows (`id: null` = new, server assigns).
5. **Cross-aggregate relationships are first-class entities**: `ApplicationDependency`,
   `Integration`, `Risk`, `Escalation`, `Decision` reference applications/projects by id arrays
   (`relatedApplicationIds`, `relatedProjectIds`) so they can link many-to-many.
6. **Enumerations** are `const` arrays + derived union types (`LIFECYCLES`, `CRITICALITIES`).
   Values are kebab-case codes; human labels come from master data, never from the value.
   Lists admins may extend are typed `string`; fixed workflow lists keep their literal union.
7. **Dates** are ISO-8601 strings (`'2026-03-14'` for dates, full ISO for timestamps).
8. **Audit metadata** on every aggregate: `audit: AuditMetadata`
   (`createdAt/By`, `updatedAt/By`, `lastReviewedAt/By`). `*By` are person ids.
9. **Never store secrets**: no passwords, tokens, API keys, connection strings or usernames.
   Environments store URLs and notes only.
10. **Structured over prose.** If someone would query it ("which apps use Oracle?"), it must be a
    field or relationship, not text inside a description.
11. **Design for scale** (500 applications, 200 projects): paged list queries, filter by id,
    read models for joined list data.

## 2. Entities (glossary)

| Entity                  | Kind            | Key relationships                                                                                                                                              |
| ----------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Application`           | aggregate       | `businessUnitId`, `roles[]`, `teams[]`, `technologies[]` (TechnologyUsage), embedded `environments`, `repositories`, `dataStores`, `documentation`             |
| `Project`               | aggregate       | `businessUnitId`, `roles[]`, `teams[]`, `applicationImpacts[]` (`applicationId` + `impactType`), embedded `milestones`, `documentation`, optional `financials` |
| `ApplicationDependency` | relationship    | `sourceApplicationId` **depends on** `targetApplicationId`; `type`, `criticality`, `description`                                                               |
| `Integration`           | relationship    | `fromApplicationId` (initiator/producer) → `toApplicationId` (receiver) or `externalPartyName`; `type` (REST, Kafka, …)                                        |
| `Team`                  | reference       | `managerId`, `memberIds[]` → Person                                                                                                                            |
| `Person`                | reference       | `businessUnitId`                                                                                                                                               |
| `BusinessUnit`          | reference       | `headId` → Person                                                                                                                                              |
| `Technology`            | catalog         | `category`, `status` (preferred / supported / deprecated / retired)                                                                                            |
| `Risk`                  | operational     | `ownerId`, `relatedApplicationIds[]`, `relatedProjectIds[]`                                                                                                    |
| `Escalation`            | operational     | `ownerId`, `responsibleTeamId`, `raisedById`, related ids                                                                                                      |
| `Decision`              | knowledge (ADR) | `decidedByIds[]`, related ids                                                                                                                                  |
| `Milestone`             | value object    | embedded in `Project`                                                                                                                                          |
| `DocumentationLink`     | value object    | typed link (`confluence`, `jira`, `architecture`, …)                                                                                                           |
| `Tag`                   | label           | lowercase slug strings; not used for relationships                                                                                                             |

"Database" and "API" are represented today as `DataStore` (embedded, technology-typed) and
`Integration` (typed interface). Promote them to aggregates only when they need independent
ownership or lifecycle — record the decision in `docs/decisions.md`.

## 3. Direction semantics (do not mix up)

- Dependency: **source depends on target**. For application X: _outgoing_ = X is source
  ("X depends on…"), _incoming_ = X is target ("…depends on X").
- Integration: **from** initiates/produces, **to** receives/serves. For X: _outbound_ = X is `from`,
  _inbound_ = X is `to`.
- Graph edges (`domains/connections/utils/graph.ts`): `depends_on`, `communicates_with`,
  `modifies` (project → application), `owns` (team → application).

## 4. Read models vs entities

- `Application` / `Project`: normalised, used by detail and edit.
- `ApplicationListItem` / `ProjectListItem`: denormalised rows (resolved names) for tables, built by
  the repository so the server can sort/filter on names.
- `EntityRef` (`{ id, name }`) for resolved references inside read models.
- `SearchResult` (`{ kind, id, title, subtitle }`) for global search across entity kinds.

## 5. Data quality

- Completeness is rule-based and configurable (`domains/governance/completeness.ts`): each rule
  has `id`, `label`, `weight`, `check(entity)`; the score is weighted passed / total and the UI
  lists the failing rules — never show a bare number without the reasons.
- Staleness: `lastReviewedAt` older than `REVIEW_INTERVAL_DAYS` (180) → "needs review".

## 6. Mock data rules

- Realistic fictional enterprise names (Customer Identity Platform, Payment Gateway, …); no
  Foo/Bar/Test App/lorem ipsum; no real company system names.
- Numeric primary keys 1..n per table in declaration order, named in `data/ids.ts`
  (`APP.paymentGateway`, `PERSON.canOzturk`); child rows take ids from `seedId(table)` via the
  builders. Every new table needs a sequence in `database.ts` and a table in
  `docs/database-schema.sql`.
- Every reference must resolve — `src/services/mock/data/integrity.test.ts` enforces this.
- Include deliberate data-quality gaps (a missing owner, a stale review) so governance features
  have something to show.
