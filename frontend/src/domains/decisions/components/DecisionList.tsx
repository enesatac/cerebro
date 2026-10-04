import { AttachmentsButton } from '@/domains/attachments/components/AttachmentsButton';
import { Accordion } from '@takeoff-ui/react-spar';
import { DetailList } from '@/components/data-display/DetailList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatDate } from '@/lib/dates';
import type { Decision } from '../types';
import { Link } from 'react-router';
import { paths } from '@/app/router/paths';
import { usePrivilege } from '@/domains/auth/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { DecisionDeleteAction } from './DecisionDeleteAction';

interface DecisionListProps {
  decisions: Decision[];
  emptyTitle: string;
}

/** Lightweight ADRs: the headline is always visible, the full record expands. */
export function DecisionList({ decisions, emptyTitle }: DecisionListProps) {
  const people = usePeopleById();
  const canEdit = usePrivilege('risks:edit');
  if (decisions.length === 0) {
    return (
      <EmptyState
        compact
        title={emptyTitle}
        description="Gerekçe toplantıdan sonra da kalsın diye önemli mimari ve iş kararlarını kaydedin."
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
                  <MasterBadge
                    list="decisionStatuses"
                    code={decision.status}
                    context="Karar durumu:"
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
                { label: 'Bağlam', value: decision.context },
                { label: 'Karar', value: decision.decision },
                { label: 'Gerekçe', value: decision.rationale },
                { label: 'Değerlendirilen alternatifler', value: decision.alternatives.join('; ') },
                { label: 'Sonuçlar', value: decision.consequences },
                {
                  label: 'Karar verenler',
                  value: decision.decidedByIds
                    .map((id) => people.data?.get(id)?.fullName ?? id)
                    .join(', '),
                },
              ]}
            />
            <p className="c-decision-list__edit">
              <AttachmentsButton
                owner={{ type: 'decision', id: decision.id }}
                ownerName={decision.title}
                showLabel
              />
            </p>
            {canEdit && (
              <p className="c-decision-list__edit">
                <Link
                  to={paths.decisionForms.edit(decision.id)}
                  className="c-link"
                  aria-label={`Kararı düzenle: ${decision.title}`}
                >
                  Kararı düzenle
                </Link>
                <DecisionDeleteAction record={decision} compact />
              </p>
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
