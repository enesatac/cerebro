import { SectionCard } from '@/components/layout/SectionCard';
import { DocumentationTable } from '@/domains/shared/components/DocumentationTable';
import type { Application } from '../../types';

export function DocumentationTab({ application }: { application: Application }) {
  return (
    <SectionCard
      title="Dokümantasyon"
      description="Confluence alanları, Jira panoları, runbook'lar, tasarımlar ve gösterge panelleri."
    >
      <DocumentationTable
        links={application.documentation}
        emptyTitle="Bu uygulamaya henüz dokümantasyon bağlanmadı"
        emptyDescription="En azından mimari genel bakışı ve destek runbook'unu bağlayın."
      />
    </SectionCard>
  );
}
