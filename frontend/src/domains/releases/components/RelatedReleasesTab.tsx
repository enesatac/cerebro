import { paths } from '@/app/router/paths';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { StatTile } from '@/components/data-display/StatTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectRefs } from '@/domains/projects/api/queries';
import type { EntityId } from '@/domains/shared/types';
import { formatDate, toIsoDate } from '@/lib/dates';
import { useReleases } from '../api/queries';
import { isOpenRelease, releaseMetrics } from '../utils/releaseCalendar';
import { releaseExportSheet } from '../utils/releaseExportSheet';
import { ReleaseTable } from './ReleaseTable';

interface RelatedReleasesTabProps {
  owner: { type: 'application' | 'project'; id: EntityId };
  ownerName: string;
}

/**
 * The releases of one application or project: what went live, what is coming, and "Geçiş ekle"
 * pre-filled with this record. Newest first.
 */
export function RelatedReleasesTab({ owner, ownerName }: RelatedReleasesTabProps) {
  const query = useReleases(
    owner.type === 'application' ? { applicationId: owner.id } : { projectId: owner.id },
  );
  const masterData = useMasterData();
  const applications = useApplicationRefs();
  const projects = useProjectRefs();
  const people = usePeopleById();
  const today = toIsoDate(new Date());
  return (
    <QueryView
      query={query}
      loadingLabel="Canlı geçişler yükleniyor"
      errorTitle="Canlı geçişler yüklenemedi"
    >
      {(all) => {
        const releases = [...all].reverse();
        const metrics = releaseMetrics(all, today);
        const next = all.find((r) => isOpenRelease(r) && r.plannedDate >= today);
        const last = releases.find((r) => r.status === 'completed');
        return (
          <div className="c-stack">
            <div className="c-stat-grid" role="group" aria-label="Canlı geçiş özeti">
              <StatTile
                label="Sıradaki geçiş"
                value={next ? formatDate(next.plannedDate) : '—'}
                detail={next ? `${next.releaseNumber} · ${next.title}` : 'planlı geçiş yok'}
                to={next ? paths.releases.detail(next.id) : undefined}
              />
              <StatTile label="Planlı" value={metrics.upcoming} detail="gelecek geçiş" />
              <StatTile
                label="Son başarılı geçiş"
                value={last ? formatDate(last.plannedDate) : '—'}
                detail={last ? last.releaseNumber : undefined}
              />
              <StatTile
                label="Geri alınan"
                value={metrics.rolledBack}
                tone={metrics.rolledBack > 0 ? 'warning' : 'default'}
              />
            </div>
            <SectionCard
              title="Canlı geçişler"
              description={`${ownerName} için kaydedilmiş geçişler; en yenisi en üstte.`}
              actions={
                <>
                  <ExcelExportButton
                    title={`${ownerName} — canlı geçişler`}
                    disabled={releases.length === 0}
                    build={() => [
                      releaseExportSheet(releases, masterData, {
                        applications: applications.data,
                        projects: projects.data,
                        people: people.data,
                        title: `${ownerName} — canlı geçişler`,
                      }),
                    ]}
                  />
                  <SmallCreateAction
                    to={paths.releases.create(
                      owner.type === 'application'
                        ? { application: owner.id }
                        : { project: owner.id },
                    )}
                    label="Geçiş ekle"
                    privilege="releases:edit"
                  />
                </>
              }
            >
              <ReleaseTable
                releases={releases}
                showApplication={owner.type !== 'application'}
                showProject={owner.type !== 'project'}
                emptyState={
                  <EmptyState
                    compact
                    title={`${ownerName} için kayıtlı canlı geçiş yok`}
                    description="Planlanan veya yapılan geçişleri geçiş numarası ve detaylarıyla kaydedin."
                  />
                }
              />
            </SectionCard>
          </div>
        );
      }}
    </QueryView>
  );
}
