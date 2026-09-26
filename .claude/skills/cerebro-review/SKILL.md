---
name: cerebro-review
description: Structured review of Cerebro changes across architecture, maintainability, TypeScript, UX consistency, accessibility, Takeoff UI compliance, data modelling, security, performance, error states, tests and duplication, reported by severity (Critical/High/Medium/Low). Activate when asked to review, audit or check a diff, branch, PR, feature or file in Cerebro.
---

# Cerebro Review

## 1. Scope

1. Determine the change set: `git diff` (staged + unstaged) or the named branch/PR/files. If the
   repository has no git history, review the files named by the user.
2. Read `CLAUDE.md` and the relevant domain docs before judging.
3. Read each changed file fully; open neighbouring code when a rule depends on context.

## 2. Checklist

| Area            | Look for                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture    | Layer violations (UI importing `services/mock`, `components/` importing `domains/`), logic in pages that belongs in `utils/`, bypassing repository hooks |
| Maintainability | Oversized components mixing responsibilities, unclear names, scattered constants                                                                         |
| TypeScript      | `any`, unsafe casts, `!` without invariant, non-exhaustive unions, index access without undefined handling                                               |
| UX consistency  | Custom headers instead of `PageHeader`, inconsistent spacing/typography, non-token colours                                                               |
| Accessibility   | Missing labels, icon-only buttons without `aria-label`, colour-only status, heading order, focus                                                         |
| Takeoff UI      | Invented props/variants (verify via MCP or `dist/index.d.ts`), raw HTML replacing an existing component, styling internal DOM                            |
| Data modelling  | Relationships as name strings, global roles, missing audit metadata, prose instead of structure                                                          |
| Security        | Secrets/credentials in records or mocks, unsafe external links (`target=_blank` without `rel`), authorisation only in UI                                 |
| Performance     | Unstable keys, missing pagination, repeated queries without keys, heavy work in render                                                                   |
| States          | Missing loading / empty / error / not-found                                                                                                              |
| Tests           | Untested utils, schemas, filters or repository behaviour; meaningless snapshots                                                                          |
| Duplication     | Re-implemented helpers, duplicated interfaces or visual patterns                                                                                         |

## 3. Verify before reporting

For every candidate issue, confirm it in the code (and in Takeoff types for API claims). Drop
anything you cannot substantiate. Do not manufacture issues to fill a severity bucket.

## 4. Report format

```markdown
## Review — <scope>

### Critical

- `path/to/file.tsx:42` — <problem>. **Impact:** <what breaks>. **Fix:** <concrete change>.

### High

### Medium

### Low

### Verified OK

- <notable things checked and found correct, briefly>
```

Severity guide: **Critical** — data loss, security exposure, broken build/route. **High** — wrong
behaviour, architectural violation that will spread, inaccessible core flow. **Medium** —
maintainability/consistency issues with real cost. **Low** — polish. Omit empty sections.
