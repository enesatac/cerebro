import type { PersonGovernanceItem } from '../types';

/** How a person is involved in a risk, escalation or decision. */
export const INVOLVEMENT_LABELS: Record<PersonGovernanceItem['involvement'][number], string> = {
  owner: 'Sahibi',
  raised: 'Açan',
  decider: 'Karar veren',
};

export const describeInvolvement = (item: PersonGovernanceItem) =>
  item.involvement.map((i) => INVOLVEMENT_LABELS[i]).join(', ');
