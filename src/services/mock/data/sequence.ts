/**
 * Child tables whose seed rows are created by builders (`role(…)`, `env(…)`, …). Each has its own
 * sequence in the database; seed rows take 1..n in the order the seed modules declare them.
 */
export type SeedChildTable =
  | 'roleAssignments'
  | 'teamAssignments'
  | 'technologyUsages'
  | 'dataStores'
  | 'repositories'
  | 'environments'
  | 'documentationLinks'
  | 'milestones'
  | 'applicationImpacts'
  | 'masterDataItems';

const counters = new Map<SeedChildTable, number>();

/** `nextval` for seed data. */
export function seedId(table: SeedChildTable): number {
  const next = (counters.get(table) ?? 0) + 1;
  counters.set(table, next);
  return next;
}
