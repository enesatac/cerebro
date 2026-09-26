import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useEscalations } from '@/domains/escalations/api/queries';
import { EscalationTable } from '@/domains/escalations/components/EscalationTable';
import { isActiveEscalation } from '@/domains/escalations/utils/escalationPresentation';
import { useRisks } from '../api/queries';
import type { RelatedEntityFilter } from '../types';
import { prioritise } from '../utils/prioritise';
import { isActiveRisk } from '../utils/riskPresentation';
import { RiskTable } from './RiskTable';
import { paths } from '@/app/router/paths';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';

interface RelatedRisksAndEscalationsProps {
  filter: RelatedEntityFilter;
  /** Name of the application/project, used in empty-state copy. */
  subjectName: string;
}

/** Escalations and risks for one application or project, active and most severe first. */
export function RelatedRisksAndEscalations({
  filter,
  subjectName,
}: RelatedRisksAndEscalationsProps) {
  const escalations = useEscalations(filter);
  const risks = useRisks(filter);
  const prefill = { application: filter.applicationId, project: filter.projectId };

  return (
    <div className="c-stack">
      <QueryView
        query={escalations}
        loadingLabel="Eskalasyonlar yükleniyor"
        errorTitle="Eskalasyonlar yüklenemedi"
      >
        {(list) => (
          <SectionCard
            title={`Eskalasyonlar (${list.filter((e) => isActiveEscalation(e.status)).length} aktif)`}
            actions={
              <SmallCreateAction to={paths.escalationForms.create(prefill)} label="Eskalasyon aç" />
            }
          >
            <EscalationTable
              escalations={prioritise(list, (e) => isActiveEscalation(e.status))}
              emptyState={
                <EmptyState compact title={`${subjectName} için açılmış eskalasyon yok`} />
              }
            />
          </SectionCard>
        )}
      </QueryView>
      <QueryView query={risks} loadingLabel="Riskler yükleniyor" errorTitle="Riskler yüklenemedi">
        {(list) => (
          <SectionCard
            title={`Riskler (${list.filter((r) => isActiveRisk(r.status)).length} aktif)`}
            actions={<SmallCreateAction to={paths.riskForms.create(prefill)} label="Risk kaydet" />}
          >
            <RiskTable
              risks={prioritise(list, (r) => isActiveRisk(r.status))}
              emptyState={<EmptyState compact title={`${subjectName} için kaydedilmiş risk yok`} />}
            />
          </SectionCard>
        )}
      </QueryView>
    </div>
  );
}
