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
      <SectionCard title="Kayıt geçmişi">
        <DetailList
          layout="grid"
          items={[
            {
              label: 'Oluşturuldu',
              value: `${formatDateTime(audit.createdAt)} · ${name(audit.createdBy)}`,
            },
            {
              label: 'Son güncelleme',
              value: `${formatDateTime(audit.updatedAt)} · ${name(audit.updatedBy)}`,
            },
            {
              label: 'Son gözden geçirme',
              value: audit.lastReviewedAt
                ? `${formatDateTime(audit.lastReviewedAt)} · ${name(audit.lastReviewedBy)}`
                : null,
              emptyText: 'Hiç gözden geçirilmedi',
            },
          ]}
        />
      </SectionCard>
      <SectionCard title="Değişiklik günlüğü">
        <EmptyState
          compact
          title="Alan düzeyinde değişiklik geçmişi henüz tutulmuyor"
          description="Denetim kaydı (kim neyi, eski ve yeni değerleriyle değiştirdi) bir backend denetim günlüğü gerektirir."
        />
      </SectionCard>
    </div>
  );
}
