import { DetailList } from '@/components/data-display/DetailList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePeopleById } from '@/domains/people/api/queries';
import type { AuditMetadata } from '@/domains/shared/types';
import { formatDateTime } from '@/lib/dates';

/** Record history for any aggregate. Field-level change history is a Governance-phase feature. */
export function AuditHistory({ audit }: { audit: AuditMetadata }) {
  const people = usePeopleById();
  const name = (id: string | null) => (id ? (people.data?.get(id)?.fullName ?? id) : 'unknown');

  return (
    <div className="c-stack">
      <SectionCard title="Record history">
        <DetailList
          layout="grid"
          items={[
            {
              label: 'Created',
              value: `${formatDateTime(audit.createdAt)} by ${name(audit.createdBy)}`,
            },
            {
              label: 'Last updated',
              value: `${formatDateTime(audit.updatedAt)} by ${name(audit.updatedBy)}`,
            },
            {
              label: 'Last reviewed',
              value: audit.lastReviewedAt
                ? `${formatDateTime(audit.lastReviewedAt)} by ${name(audit.lastReviewedBy)}`
                : null,
              emptyText: 'Never reviewed',
            },
          ]}
        />
      </SectionCard>
      <SectionCard title="Change log">
        <EmptyState
          compact
          title="Field-level change history is not recorded yet"
          description="Audit logging (who changed what, with old and new values) requires a backend audit log."
        />
      </SectionCard>
    </div>
  );
}
