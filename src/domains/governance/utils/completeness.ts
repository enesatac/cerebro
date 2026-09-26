import type { CompletenessReport, CompletenessRule } from '../types';

export function evaluateCompleteness<T>(
  entity: T,
  rules: readonly CompletenessRule<T>[],
): CompletenessReport {
  const applicable = rules.filter((rule) => rule.appliesTo?.(entity) ?? true);
  const results = applicable.map((rule) => ({
    id: rule.id,
    label: rule.label,
    description: rule.description,
    importance: rule.importance,
    satisfied: rule.isSatisfied(entity),
  }));
  const totalWeight = applicable.reduce((sum, rule) => sum + rule.weight, 0);
  const satisfiedWeight = applicable.reduce(
    (sum, rule, index) => sum + (results[index]?.satisfied ? rule.weight : 0),
    0,
  );
  return {
    score: totalWeight === 0 ? 100 : Math.round((satisfiedWeight / totalWeight) * 100),
    results,
    missing: results.filter((result) => !result.satisfied),
  };
}
