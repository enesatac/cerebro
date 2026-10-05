import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { AuditHistory } from '@/domains/governance/components/AuditHistory';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { formatDateLong, toIsoDate } from '@/lib/dates';
import { isNotFoundError } from '@/lib/errors';
import { parseId } from '@/lib/urlParams';
import { useRelease } from '../api/queries';
import { ReleaseDeleteAction } from '../components/ReleaseDeleteAction';
import type { Release } from '../types';
import { awaitsOutcome, releaseWindow } from '../utils/releaseCalendar';

function TextSection({ title, text, empty }: { title: string; text: string; empty: string }) {
  return (
    <SectionCard title={title}>
      {text ? <p className="c-prose">{text}</p> : <p className="c-muted">{empty}</p>}
    </SectionCard>
  );
}

function ReleaseView({ release }: { release: Release }) {
  const navigate = useNavigate();
  const applications = useApplicationRefs();
  const projects = useProjectRefs();
  const people = usePeopleById();
  const today = toIsoDate(new Date());
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Canlı geçişler', to: paths.releases.list() },
          { label: release.releaseNumber },
        ]}
        title={release.title}
        meta={
          <>
            <span className="c-code-chip">{release.releaseNumber}</span>
            <MasterBadge list="releaseStatuses" code={release.status} context="Durum:" />
            <span className="c-muted">
              <MasterLabel list="releaseTypes" code={release.type} />
            </span>
            {release.serviceInterruption && <StatusBadge label="Kesinti var" variant="danger" />}
            {awaitsOutcome(release, today) && (
              <StatusBadge label="Sonucu girilmedi" variant="warning" />
            )}
          </>
        }
        actions={
          <>
            <EditAction to={paths.releases.edit(release.id)} privilege="releases:edit" />
            <ReleaseDeleteAction
              record={release}
              onDeleted={() => void navigate(paths.releases.list())}
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
              label: 'Uygulama',
              value: (
                <EntityLink to={paths.applications.detail(release.applicationId)}>
                  {applications.data?.get(release.applicationId)?.name ??
                    `#${release.applicationId}`}
                </EntityLink>
              ),
            },
            {
              label: 'Proje',
              value:
                release.projectId !== null ? (
                  <EntityLink to={paths.projects.detail(release.projectId)}>
                    {projects.data?.get(release.projectId)?.name ?? `#${release.projectId}`}
                  </EntityLink>
                ) : null,
              emptyText: 'Projeye bağlı değil',
            },
            { label: 'Tarih', value: formatDateLong(release.plannedDate) },
            { label: 'Geçiş penceresi', value: releaseWindow(release) },
            { label: 'Sürüm', value: release.version },
            {
              label: 'Geçiş sorumlusu',
              value:
                release.ownerId !== null ? (
                  <PersonSummary
                    person={people.data?.get(release.ownerId)}
                    fallbackId={release.ownerId}
                  />
                ) : null,
              emptyText: 'Atanmamış',
            },
            {
              label: 'Hizmet kesintisi',
              value: release.serviceInterruption ? 'Var' : 'Yok',
            },
          ]}
        />
      </section>
      <div className="c-two-column">
        <div className="c-stack">
          <TextSection
            title="Geçiş detayları"
            text={release.description}
            empty="Detay yazılmadı."
          />
          <TextSection
            title="Geri alma planı"
            text={release.rollbackPlan}
            empty="Geri alma planı yazılmadı."
          />
        </div>
        <div className="c-stack">
          <TextSection
            title="Sonuç"
            text={release.outcomeNote}
            empty="Geçiş sonrası sonuç henüz girilmedi."
          />
          <AuditHistory audit={release.audit} />
        </div>
      </div>
    </div>
  );
}

export default function ReleaseDetailPage() {
  const requestedId = useParams().releaseId ?? '';
  const query = useRelease(parseId(requestedId) ?? 0);
  if (query.isPending) return <LoadingState label="Canlı geçiş yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Canlı geçiş bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir canlı geçiş yok.`}
        backTo={paths.releases.list()}
        backLabel="Canlı geçişlere dön"
      />
    ) : (
      <ErrorState title="Bu canlı geçiş yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }
  return <ReleaseView release={query.data} />;
}
