import { SectionCard } from '@/components/layout/SectionCard';
import { DocumentationTable } from '@/domains/shared/components/DocumentationTable';
import type { Application } from '../../types';

export function DocumentationTab({ application }: { application: Application }) {
  return (
    <SectionCard
      title="Documentation"
      description="Confluence spaces, Jira boards, runbooks, designs and dashboards."
    >
      <DocumentationTable
        links={application.documentation}
        emptyTitle="No documentation has been linked to this application yet"
        emptyDescription="Link at least the architecture overview and the support runbook."
      />
    </SectionCard>
  );
}
