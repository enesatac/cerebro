import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { CopyLinkButton } from '@/components/actions/CopyLinkButton';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { AttachmentsSection } from '@/domains/attachments/components/AttachmentsSection';
import { EditAction } from '@/domains/auth/components/RecordActions';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { formatDate } from '@/lib/dates';
import { isNotFoundError } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { parseId } from '@/lib/urlParams';
import { useContract, useVendors } from '../api/queries';
import { ContractAlerts } from '../components/ContractAlerts';
import { ContractDeleteAction } from '../components/ContractDeleteAction';
import { PaymentPlan } from '../components/PaymentPlan';
import type { Contract } from '../types';
import { noticeDeadline } from '../utils/contractSchedule';

function ContractView({ contract }: { contract: Contract }) {
  const navigate = useNavigate();
  const projects = useProjectRefs();
  const vendors = useVendors();
  const people = usePeopleById();
  const applications = useApplicationRefs();
  const vendor = vendors.data?.find((v) => v.id === contract.vendorId);
  const project = projects.data?.get(contract.projectId);
  const notice = noticeDeadline(contract);

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Sözleşmeler', to: paths.contracts.list() },
          { label: contract.code },
        ]}
        title={contract.title}
        meta={
          <>
            <span className="c-muted">{contract.code}</span>
            <MasterBadge list="contractStatuses" code={contract.status} context="Durum:" />
            <span className="c-muted">
              <MasterLabel list="contractTypes" code={contract.type} />
            </span>
          </>
        }
        actions={
          <>
            <EditAction to={paths.contracts.edit(contract.id)} privilege="contracts:edit" />
            <ContractDeleteAction
              record={contract}
              onDeleted={() => void navigate(paths.projects.detail(contract.projectId))}
            />
            <CopyLinkButton />
          </>
        }
      />
      <ContractAlerts contract={contract} />
      <section aria-label="Temel bilgiler" className="c-key-facts">
        <DetailList
          layout="grid"
          items={[
            {
              label: 'Proje',
              value: (
                <EntityLink to={paths.projects.detail(contract.projectId)}>
                  {project?.name ?? `#${contract.projectId}`}
                </EntityLink>
              ),
            },
            { label: 'Tedarikçi', value: vendor?.name },
            {
              label: 'Sözleşme sorumlusu',
              value:
                contract.ownerId !== null ? (
                  <PersonSummary
                    person={people.data?.get(contract.ownerId)}
                    fallbackId={contract.ownerId}
                  />
                ) : null,
              emptyText: 'Atanmamış',
            },
            {
              label: 'Bedel',
              value:
                contract.totalValue !== null
                  ? formatCurrency(contract.totalValue, contract.currency)
                  : null,
            },
            {
              label: 'Faturalama',
              value: <MasterLabel list="billingFrequencies" code={contract.billingFrequency} />,
            },
            { label: 'Sipariş no', value: contract.purchaseOrderNumber },
            {
              label: 'İmza tarihi',
              value: contract.signedDate ? formatDate(contract.signedDate) : null,
              emptyText: 'İmzalanmadı',
            },
            {
              label: 'Başlangıç – bitiş',
              value: contract.startDate
                ? `${formatDate(contract.startDate)} – ${contract.endDate ? formatDate(contract.endDate) : 'Süresiz'}`
                : null,
            },
            {
              label: 'Yenileme',
              value: contract.autoRenewal ? 'Otomatik yenilenir' : 'Kendiliğinden yenilenmez',
            },
            {
              label: 'İhbar süresi',
              value: contract.noticePeriodDays
                ? `${contract.noticePeriodDays} gün${notice ? ` · son bildirim ${formatDate(notice)}` : ''}`
                : null,
              emptyText: 'Yok',
            },
          ]}
        />
      </section>
      <div className="c-two-column">
        <div className="c-stack">
          <SectionCard
            title="Ödeme planı"
            description="Taksitler, faturalar ve ödemeler; iptal edilenler toplamlara katılmaz."
          >
            <PaymentPlan contract={contract} />
          </SectionCard>
          <AttachmentsSection
            owner={{ type: 'contract', id: contract.id }}
            ownerName={`${contract.code} ${contract.title}`}
            title="Sözleşme belgeleri"
            description="İmzalı sözleşme, teklifler, satın alma siparişi ve faturalar."
            defaultType="invoice"
          />
        </div>
        <div className="c-stack">
          <SectionCard title="Kapsam">
            {contract.description ? (
              <p className="c-prose">{contract.description}</p>
            ) : (
              <p className="c-muted">Kapsam yazılmadı.</p>
            )}
          </SectionCard>
          <SectionCard title="İlgili uygulamalar">
            {contract.relatedApplicationIds.length === 0 ? (
              <p className="c-muted">Bağlı uygulama yok.</p>
            ) : (
              <ul className="c-rule-list">
                {contract.relatedApplicationIds.map((id) => (
                  <li key={id} className="c-rule-list__item">
                    <EntityLink to={paths.applications.detail(id)}>
                      {applications.data?.get(id)?.name ?? `#${id}`}
                    </EntityLink>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          {vendor && (
            <SectionCard title="Tedarikçi iletişim">
              <DetailList
                items={[
                  { label: 'Firma', value: vendor.name },
                  { label: 'Vergi no', value: vendor.taxNumber },
                  { label: 'İletişim kişisi', value: vendor.contactName },
                  {
                    label: 'E-posta',
                    value: vendor.contactEmail ? (
                      <a className="c-link" href={`mailto:${vendor.contactEmail}`}>
                        {vendor.contactEmail}
                      </a>
                    ) : null,
                  },
                  { label: 'Telefon', value: vendor.contactPhone },
                ]}
              />
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractDetailPage() {
  const requestedId = useParams().contractId ?? '';
  // Unknown or malformed ids resolve to 0, which no sequence ever produces → "not found".
  const query = useContract(parseId(requestedId) ?? 0);
  if (query.isPending) return <LoadingState label="Sözleşme yükleniyor" rows={6} />;
  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NotFoundState
        title="Sözleşme bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir sözleşme yok.`}
        backTo={paths.contracts.list()}
        backLabel="Sözleşmelere dön"
      />
    ) : (
      <ErrorState title="Bu sözleşme yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }
  return <ContractView contract={query.data} />;
}
