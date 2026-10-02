import { useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { useMasterData } from '@/domains/master-data/context';
import { personWorkbook } from '../utils/personExport';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatTile } from '@/components/data-display/StatTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { formatDateRange, toIsoDate } from '@/lib/dates';
import { isNotFoundError } from '@/lib/errors';
import { parseId } from '@/lib/urlParams';
import { describeLoad, LOAD_PRESENTATION } from '@/domains/resources/utils/loadPresentation';
import { loadLevel } from '@/domains/resources/utils/resourcePlan';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { usePersonWorkload } from '../api/queries';
import { PersonAllocationTable } from '../components/PersonAllocationTable';
import { PersonGovernanceTable } from '../components/PersonGovernanceTable';
import { PersonWorkTable } from '../components/PersonWorkTable';
import type { PersonWorkload } from '../types';

function TeamList({ teams }: { teams: PersonWorkload['teams'] }) {
  return (
    <ul className="c-plain-list">
      {teams.map(({ team, manager }) => (
        <li key={team.id}>
          <EntityLink to={paths.teams.detail(team.id)}>{team.name}</EntityLink>
          {manager && <span className="c-muted"> · yönetici</span>}
        </li>
      ))}
    </ul>
  );
}

function LeaveStatus({ leaves, today }: { leaves: PersonWorkload['leaves']; today: string }) {
  const [next] = leaves;
  if (!next) return null;
  const away = next.startDate <= today;
  return (
    <span className="c-cell-stack">
      <span>
        {away ? 'Şu anda izinde' : 'Sıradaki izin'}: {formatDateRange(next.startDate, next.endDate)}
      </span>
      <span className="c-person-leave">
        <MasterBadge list="leaveTypes" code={next.type} />
        {leaves.length > 1 && (
          <span className="c-muted c-cell-stack__secondary">+{leaves.length - 1} izin daha</span>
        )}
      </span>
    </span>
  );
}

/**
 * One person and everything they are mapped to: the applications and projects they hold a role
 * on or work on through a team, the risks, escalations and decisions they own or took part in,
 * their teams and upcoming leaves — their work on one screen.
 */
export default function PersonDetailPage() {
  const requestedId = useParams().personId ?? '';
  // Unknown or malformed ids resolve to 0, which no sequence ever produces → "not found".
  const personId = parseId(requestedId) ?? 0;
  const today = toIsoDate(new Date());
  const query = usePersonWorkload(personId, today);
  const masterData = useMasterData();

  if (query.isPending) return <LoadingState label="Kişi yükleniyor" rows={8} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Kişi bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir kişi yok.`}
        backTo={paths.teams.list()}
        backLabel="Ekiplere dön"
      />
    ) : (
      <ErrorState title="Bu kişi yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }

  const workload = query.data;
  const { person } = workload;
  const firstName = person.fullName.split(' ')[0] ?? person.fullName;
  const activeRisks = workload.risks.filter((r) => r.active).length;
  const activeEscalations = workload.escalations.filter((e) => e.active).length;
  const directRoles = (items: PersonWorkload['applications']) =>
    items.filter((item) => item.roles.length > 0).length;

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Ekipler', to: paths.teams.list() }, { label: person.fullName }]}
        title={person.fullName}
        subtitle={person.jobTitle}
        actions={
          <>
            <ExcelExportButton
              title={`${person.fullName} — iş özeti`}
              build={() => personWorkbook(workload, masterData)}
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
              label: 'E-posta',
              value: (
                <a className="c-link" href={`mailto:${person.email}`}>
                  {person.email}
                </a>
              ),
            },
            { label: 'Konum', value: person.location },
            { label: 'İş birimi', value: workload.businessUnit?.name },
            {
              label: 'Ekipler',
              value: workload.teams.length > 0 ? <TeamList teams={workload.teams} /> : null,
              emptyText: 'Hiçbir ekipte değil',
            },
            ...(workload.headOf.length > 0
              ? [
                  {
                    label: 'Yönettiği iş birimleri',
                    value: workload.headOf.map((unit) => unit.name).join(', '),
                  },
                ]
              : []),
            {
              label: 'Bugünkü iş yükü',
              value: (
                <StatusBadge
                  label={describeLoad(workload.loadToday.count, workload.loadToday.percent)}
                  variant={LOAD_PRESENTATION[loadLevel(workload.loadToday.percent)].variant}
                />
              ),
            },
            {
              label: 'İzin durumu',
              value:
                workload.leaves.length > 0 ? (
                  <LeaveStatus leaves={workload.leaves} today={today} />
                ) : null,
              emptyText: 'Planlanmış izin yok',
            },
          ]}
        />
      </section>

      <div className="c-stat-grid" role="group" aria-label="Özet">
        <StatTile
          label="Uygulamalar"
          value={workload.applications.length}
          detail={`${directRoles(workload.applications)} tanesinde doğrudan rolü var`}
        />
        <StatTile
          label="Projeler"
          value={workload.projects.length}
          detail={`${directRoles(workload.projects)} tanesinde doğrudan rolü var`}
        />
        <StatTile
          label="Aktif eskalasyonlar"
          value={activeEscalations}
          detail={`toplam ${workload.escalations.length}`}
          tone={activeEscalations > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="Aktif riskler"
          value={activeRisks}
          detail={`toplam ${workload.risks.length} · ${workload.decisions.length} karar`}
          tone={activeRisks > 0 ? 'warning' : 'default'}
        />
      </div>

      <SectionCard
        title={`Uygulamalar (${workload.applications.length})`}
        description="Rol üstlendiği veya ekibi üzerinden çalıştığı uygulamalar."
      >
        <PersonWorkTable
          kind="application"
          items={workload.applications}
          emptyTitle={`${firstName} hiçbir uygulamada yer almıyor`}
        />
      </SectionCard>

      <SectionCard
        title={`Projeler (${workload.projects.length})`}
        description="Rol üstlendiği veya ekibi üzerinden çalıştığı projeler."
      >
        <PersonWorkTable
          kind="project"
          items={workload.projects}
          emptyTitle={`${firstName} hiçbir projede yer almıyor`}
        />
      </SectionCard>

      <SectionCard
        title={`Kaynak planı (${workload.allocations.length})`}
        description="Süren ve planlanmış proje atamaları; aynı anda kaç işte, zamanının ne kadarıyla."
        actions={<EntityLink to={paths.resources(person.fullName)}>Kaynak planında gör</EntityLink>}
      >
        <PersonAllocationTable allocations={workload.allocations} />
      </SectionCard>

      <SectionCard
        title={`Eskalasyonlar (${workload.escalations.length})`}
        description="Sahibi olduğu veya açtığı eskalasyonlar."
      >
        <PersonGovernanceTable
          items={workload.escalations}
          statusList="escalationStatuses"
          dateHeader="Hedef tarih"
          emptyTitle="Sorumlu olduğu eskalasyon yok"
        />
      </SectionCard>

      <SectionCard
        title={`Riskler (${workload.risks.length})`}
        description="Sahibi olduğu riskler."
      >
        <PersonGovernanceTable
          items={workload.risks}
          statusList="riskStatuses"
          dateHeader="Hedef tarih"
          emptyTitle="Sahibi olduğu risk yok"
        />
      </SectionCard>

      <SectionCard
        title={`Kararlar (${workload.decisions.length})`}
        description="Karar verenler arasında yer aldığı mimari ve iş kararları."
      >
        <PersonGovernanceTable
          items={workload.decisions}
          statusList="decisionStatuses"
          dateHeader="Karar tarihi"
          emptyTitle="Yer aldığı karar yok"
        />
      </SectionCard>

      <SectionCard
        title={`İzinler (${workload.leaves.length})`}
        description="Süren ve planlanmış izinler."
        actions={<EntityLink to={paths.leaves()}>İzin takvimine git</EntityLink>}
      >
        {workload.leaves.length === 0 ? (
          <EmptyState compact title="Planlanmış izin yok" />
        ) : (
          <ul className="c-rule-list">
            {workload.leaves.map((leave) => (
              <li key={leave.id} className="c-rule-list__item c-person-leave">
                <MasterBadge list="leaveTypes" code={leave.type} />
                <span>{formatDateRange(leave.startDate, leave.endDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
