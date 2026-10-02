import { AttachmentsSection } from '@/domains/attachments/components/AttachmentsSection';
import { SectionCard } from '@/components/layout/SectionCard';
import { DocumentationTable } from '@/domains/shared/components/DocumentationTable';
import type { Application } from '../../types';

export function DocumentationTab({ application }: { application: Application }) {
  return (
    <div className="c-stack">
      <AttachmentsSection
        owner={{ type: 'application', id: application.id }}
        ownerName={application.name}
      />
      <SectionCard
        title="Bağlantılar"
        description="Confluence alanları, Jira panoları, runbook'lar, tasarımlar ve gösterge panelleri."
      >
        <DocumentationTable
          exportTitle={`${application.name} — dokümantasyon`}
          links={application.documentation}
          emptyTitle="Bu uygulamaya henüz dokümantasyon bağlanmadı"
          emptyDescription="En azından mimari genel bakışı ve destek runbook'unu bağlayın."
        />
      </SectionCard>
    </div>
  );
}
