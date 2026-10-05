import { useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePrivilege } from '@/domains/auth/api/queries';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { toIsoDate } from '@/lib/dates';
import { isNotFoundError } from '@/lib/errors';
import { parseId } from '@/lib/urlParams';
import { useProcurement } from '../api/queries';
import { NotesPanel } from '../components/NotesPanel';
import { ProcessStateBadge } from '../components/ProcessStateBadge';
import { StepsTimeline } from '../components/StepsTimeline';
import type { ProcurementProcess } from '../types';
import { processState, progress } from '../utils/processState';

function ProcessView({ process }: { process: ProcurementProcess }) {
  const today = toIsoDate(new Date());
  const canSeeContract = usePrivilege('contracts:view');
  const projects = useProjectRefs();
  const units = useBusinessUnitsById();
  const people = usePeopleById();
  const { closed, total } = progress(process.steps);
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Satın alma takibi', to: paths.procurement.list() },
          { label: process.code },
        ]}
        title={process.title}
        meta={
          <>
            <span className="c-muted">{process.code}</span>
            <ProcessStateBadge state={processState(process.steps, today)} />
          </>
        }
        actions={
          <>
            <EditAction
              to={paths.procurement.editSteps(process.contractId)}
              privilege="procurement:edit"
            />
            <CopyLinkButton />
          </>
        }
      />
      <section aria-label="Temel bilgiler" className="c-key-facts">
        <DetailList
          layout="grid"
          items={[
            {
              label: 'Proje',
              value: (
                <EntityLink to={paths.projects.detail(process.projectId)}>
                  {projects.data?.get(process.projectId)?.name ?? `#${process.projectId}`}
                </EntityLink>
              ),
            },
            {
              label: 'İş birimi',
              value:
                process.businessUnitId !== null
                  ? units.data?.get(process.businessUnitId)?.name
                  : null,
            },
            { label: 'Tedarikçi', value: process.vendorName },
            {
              label: 'Sözleşme',
              value: canSeeContract ? (
                <EntityLink to={paths.contracts.detail(process.contractId)}>
                  {process.code}
                </EntityLink>
              ) : (
                process.code
              ),
            },
            {
              label: 'Sözleşme durumu',
              value: <MasterBadge list="contractStatuses" code={process.contractStatus} />,
            },
            {
              label: 'Sorumlu',
              value: process.ownerId !== null ? people.data?.get(process.ownerId)?.fullName : null,
              emptyText: 'Atanmamış',
            },
            { label: 'İlerleme', value: total ? `${closed}/${total} adım` : null },
          ]}
        />
      </section>
      <SectionCard
        title="Süreç adımları"
        description="Planlanan ve gerçekleşen tarihler; sapma, bitiş tarihine göre hesaplanır."
      >
        <StepsTimeline
          steps={process.steps}
          today={today}
          emptyState={<EmptyState compact title="Süreç adımları henüz tanımlanmadı" />}
        />
      </SectionCard>
      <SectionCard title="Notlar" description="En yeni not en üstte.">
        <NotesPanel process={process} />
      </SectionCard>
    </div>
  );
}

export default function ProcurementDetailPage() {
  const requestedId = useParams().contractId ?? '';
  const query = useProcurement(parseId(requestedId) ?? 0);
  if (query.isPending) return <LoadingState label="Satın alma yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Satın alma bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir satın alma yok.`}
        backTo={paths.procurement.list()}
        backLabel="Satın alma takibine dön"
      />
    ) : (
      <ErrorState title="Bu satın alma yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }
  return <ProcessView process={query.data} />;
}
