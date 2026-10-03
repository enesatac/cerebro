import { Alert, Badge, Button } from '@takeoff-ui/react-spar';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { FlagIconOutlinedRounded } from '@takeoff-icons/react/flag';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { ButtonLink } from '@/components/actions/ButtonLink';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { TagList } from '@/components/data-display/TagList';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { AttachmentsSection } from '@/domains/attachments/components/AttachmentsSection';
import { useCurrentUser, usePermission } from '@/domains/auth/api/queries';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import { formatDate } from '@/lib/dates';
import { isNotFoundError } from '@/lib/errors';
import { formatCurrency, formatInteger } from '@/lib/format';
import { parseId } from '@/lib/urlParams';
import { useDemand } from '../api/queries';
import { DemandAssessmentDialog } from '../components/DemandAssessmentDialog';
import { DemandAssessmentSummary } from '../components/DemandAssessmentSummary';
import { DemandDeleteAction } from '../components/DemandDeleteAction';
import { DemandHistory } from '../components/DemandHistory';
import { DemandWithdrawAction } from '../components/DemandWithdrawAction';
import type { Demand } from '../types';
import { canAttachToDemand, canEditDemand, ownsDemand } from '../utils/demandAccess';

/** What the requester should know first: a question to answer, or why it was turned down. */
function DecisionNotice({ demand, mine }: { demand: Demand; mine: boolean }) {
  const note = demand.assessment.decisionNote;
  if (demand.status === 'needs-info') {
    return (
      <Alert variant="warning" appearance="outlined">
        <Alert.Content>
          <Alert.Title level={2}>Portföy ofisi bilgi bekliyor</Alert.Title>
          <Alert.Description>{note}</Alert.Description>
          {mine && (
            <Alert.Description>
              Talebi güncellediğinizde yeniden değerlendirme sırasına girer.
            </Alert.Description>
          )}
        </Alert.Content>
      </Alert>
    );
  }
  if (demand.status === 'rejected') {
    return (
      <Alert variant="neutral" appearance="outlined">
        <Alert.Content>
          <Alert.Title level={2}>Talep reddedildi</Alert.Title>
          <Alert.Description>{note}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return null;
}

function DemandView({ demand }: { demand: Demand }) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const canManage = usePermission('demands:manage');
  const people = usePeopleById();
  const units = useBusinessUnitsById();
  const applications = useApplicationRefs();
  const masterData = useMasterData();
  const [assessing, setAssessing] = useState(false);
  const mine = ownsDemand(user, demand);
  const canAttach = canAttachToDemand(user, demand);

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Talepler', to: paths.demands.list() }, { label: demand.code }]}
        title={demand.title}
        meta={
          <>
            <span className="c-muted">{demand.code}</span>
            <MasterBadge list="demandStatuses" code={demand.status} context="Durum:" />
            {demand.assessment.priority && (
              <MasterBadge
                list="demandPriorities"
                code={demand.assessment.priority}
                context="Öncelik:"
              />
            )}
            <span className="c-muted">
              <MasterLabel list="demandTypes" code={demand.type} />
            </span>
            {demand.regulatory && (
              <Badge variant="warning" appearance="outlined" size="small">
                Yasal zorunluluk
              </Badge>
            )}
          </>
        }
        actions={
          <>
            {canManage && (
              <Button
                startContent={<FlagIconOutlinedRounded aria-hidden="true" />}
                onClick={() => setAssessing(true)}
              >
                Değerlendir
              </Button>
            )}
            {canEditDemand(user, demand) && (
              <ButtonLink
                to={paths.demands.edit(demand.id)}
                variant="neutral"
                appearance="outlined"
                startContent={<EditIconOutlinedRounded aria-hidden="true" />}
              >
                {demand.status === 'needs-info' && mine ? 'Bilgi ekle' : 'Düzenle'}
              </ButtonLink>
            )}
            <DemandWithdrawAction demand={demand} />
            <DemandDeleteAction
              record={demand}
              onDeleted={() => void navigate(paths.demands.manage())}
            />
            <CopyLinkButton />
          </>
        }
      />
      <DecisionNotice demand={demand} mine={mine} />
      <section aria-label="Temel bilgiler" className="c-key-facts">
        <DetailList
          layout="grid"
          items={[
            { label: 'İş birimi', value: units.data?.get(demand.businessUnitId)?.name },
            {
              label: 'Talep eden',
              value: (
                <PersonSummary
                  person={people.data?.get(demand.requesterId)}
                  fallbackId={demand.requesterId}
                />
              ),
            },
            {
              label: 'Sponsor',
              value:
                demand.sponsorId !== null ? (
                  <PersonSummary
                    person={people.data?.get(demand.sponsorId)}
                    fallbackId={demand.sponsorId}
                  />
                ) : null,
              emptyText: 'Yok',
            },
            { label: 'Gönderim', value: formatDate(demand.submittedAt) },
            {
              label: 'Aciliyet',
              value: <MasterBadge list="criticalities" code={demand.urgency} />,
            },
            {
              label: 'İstenen tarih',
              value: demand.desiredDate ? formatDate(demand.desiredDate) : null,
              emptyText: 'Belirtilmedi',
            },
            {
              label: 'Etkilenen kullanıcı',
              value: demand.affectedUsers !== null ? formatInteger(demand.affectedUsers) : null,
            },
            {
              label: 'Tahmini bütçe',
              value:
                demand.estimatedBudget !== null
                  ? formatCurrency(demand.estimatedBudget, demand.currency)
                  : null,
            },
          ]}
        />
      </section>
      <div className="c-two-column">
        <div className="c-stack">
          <SectionCard title="Talep">
            <DetailList
              items={[
                {
                  label: 'Mevcut durum ve ihtiyaç',
                  value: <p className="c-prose">{demand.problem}</p>,
                },
                {
                  label: 'Beklenen çözüm ve kapsam',
                  value: demand.proposedSolution ? (
                    <p className="c-prose">{demand.proposedSolution}</p>
                  ) : null,
                },
                {
                  label: 'Beklenen fayda',
                  value: <p className="c-prose">{demand.expectedBenefits}</p>,
                },
                {
                  label: 'Fayda türleri',
                  value: demand.benefitTypes.length ? (
                    <TagList
                      tags={demand.benefitTypes.map((code) =>
                        masterData.label('demandBenefitTypes', code),
                      )}
                    />
                  ) : null,
                },
                {
                  label: 'Tarih gerekçesi',
                  value: demand.deadlineReason,
                },
                {
                  label: 'İlgili uygulamalar',
                  value: demand.relatedApplicationIds.length ? (
                    <ul className="c-inline-list">
                      {demand.relatedApplicationIds.map((id) => (
                        <li key={id}>
                          <EntityLink to={paths.applications.detail(id)}>
                            {applications.data?.get(id)?.name ?? `#${id}`}
                          </EntityLink>
                        </li>
                      ))}
                    </ul>
                  ) : null,
                },
              ]}
            />
          </SectionCard>
          <AttachmentsSection
            owner={{ type: 'demand', id: demand.id }}
            ownerName={`${demand.code} ${demand.title}`}
            description="İş gerekçesi, mevzuat metni, ekran görüntüleri, teklifler…"
            access={{ edit: canAttach, remove: canAttach }}
            defaultType="business-case"
          />
        </div>
        <div className="c-stack">
          <SectionCard
            title="Değerlendirme"
            description="Portföy ofisinin puanlaması, önceliği ve takvimi."
          >
            <DemandAssessmentSummary demand={demand} />
          </SectionCard>
          <SectionCard title="Durum geçmişi">
            <DemandHistory events={demand.history} />
          </SectionCard>
        </div>
      </div>
      {assessing && <DemandAssessmentDialog demand={demand} onClose={() => setAssessing(false)} />}
    </div>
  );
}

export default function DemandDetailPage() {
  const requestedId = useParams().demandId ?? '';
  // Unknown or malformed ids resolve to 0, which no sequence ever produces → "not found".
  const query = useDemand(parseId(requestedId) ?? 0);

  if (query.isPending) return <LoadingState label="Talep yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Talep bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir talep yok.`}
        backTo={paths.demands.list()}
        backLabel="Taleplere dön"
      />
    ) : (
      <ErrorState title="Bu talep yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }
  return <DemandView demand={query.data} />;
}
