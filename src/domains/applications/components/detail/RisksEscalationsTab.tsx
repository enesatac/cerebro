import { RelatedRisksAndEscalations } from '@/domains/risks/components/RelatedRisksAndEscalations';
import type { Application } from '../../types';

export function RisksEscalationsTab({ application }: { application: Application }) {
  return (
    <RelatedRisksAndEscalations
      filter={{ applicationId: application.id }}
      subjectName={application.name}
    />
  );
}
