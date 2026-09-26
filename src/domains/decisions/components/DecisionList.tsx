import { Accordion } from '@takeoff-ui/react-spar';
import { DetailList } from '@/components/data-display/DetailList';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatDate } from '@/lib/dates';
import type { Decision } from '../types';
import { DECISION_STATUS_PRESENTATION } from '../utils/decisionPresentation';
import { Link } from 'react-router';
import { paths } from '@/app/router/paths';
import { usePermission } from '@/domains/auth/api/queries';

interface DecisionListProps {
  decisions: Decision[];
  emptyTitle: string;
}

/** Lightweight ADRs: the headline is always visible, the full record expands. */
export function DecisionList({ decisions, emptyTitle }: DecisionListProps) {
  const people = usePeopleById();
  const canEdit = usePermission('portfolio:edit');
  if (decisions.length === 0) {
    return (
      <EmptyState
        compact
        title={emptyTitle}
        description="Record significant architectural and business decisions so the reasoning outlives the meeting."
      />
    );
  }

  const ordered = [...decisions].sort((a, b) => b.decisionDate.localeCompare(a.decisionDate));
  return (
    <Accordion multiple className="c-decision-list">
      {ordered.map((decision) => (
        <Accordion.Item key={decision.id} value={decision.id}>
          <Accordion.Header>
            <Accordion.Trigger>
              <span className="c-decision-list__heading">
                <span className="c-decision-list__title">{decision.title}</span>
                <span className="c-decision-list__meta">
                  <StatusBadge
                    {...DECISION_STATUS_PRESENTATION[decision.status]}
                    context="Decision status:"
                  />
                  <span className="c-muted">{formatDate(decision.decisionDate)}</span>
                </span>
              </span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <DetailList
              items={[
                { label: 'Context', value: decision.context },
                { label: 'Decision', value: decision.decision },
                { label: 'Rationale', value: decision.rationale },
                { label: 'Alternatives considered', value: decision.alternatives.join('; ') },
                { label: 'Consequences', value: decision.consequences },
                {
                  label: 'Decided by',
                  value: decision.decidedByIds
                    .map((id) => people.data?.get(id)?.fullName ?? id)
                    .join(', '),
                },
              ]}
            />
            {canEdit && (
              <p className="c-decision-list__edit">
                <Link
                  to={paths.decisionForms.edit(decision.id)}
                  className="c-link"
                  aria-label={`Edit decision: ${decision.title}`}
                >
                  Edit decision
                </Link>
              </p>
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
