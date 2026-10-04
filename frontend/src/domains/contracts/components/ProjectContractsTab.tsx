import { useMemo } from 'react';
import { paths } from '@/app/router/paths';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { StatTile } from '@/components/data-display/StatTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { SmallCreateAction } from '@/domains/auth/components/RecordActions';
import type { Project } from '@/domains/projects/types';
import { toIsoDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { useContracts, useVendors } from '../api/queries';
import { overduePayments, paymentSummary, totalsByCurrency } from '../utils/contractSchedule';
import { ContractTable } from './ContractTable';
import { useContractExport } from './useContractExport';

const formatTotals = (totals: { currency: string; amount: number }[]) =>
  totals.length === 0 ? '—' : totals.map((t) => formatCurrency(t.amount, t.currency)).join(' · ');

/**
 * A project's purchases: what is committed against its budget (in the budget's currency), what is
 * paid, what is overdue, and the contracts themselves.
 */
export function ProjectContractsTab({ project }: { project: Project }) {
  const query = useContracts({ projectId: project.id });
  const vendors = useVendors();
  const vendorById = useMemo(
    () => new Map((vendors.data ?? []).map((vendor) => [vendor.id, vendor])),
    [vendors.data],
  );
  const exportContracts = useContractExport(vendorById);
  const today = toIsoDate(new Date());
  return (
    <QueryView
      query={query}
      loadingLabel="Sözleşmeler yükleniyor"
      errorTitle="Sözleşmeler yüklenemedi"
    >
      {(contracts) => {
        const live = contracts.filter((c) => c.status !== 'terminated' && c.status !== 'draft');
        const budget = project.financials;
        const committedInBudgetCurrency = budget
          ? live
              .filter((c) => c.currency === budget.currency)
              .reduce((sum, c) => sum + (c.totalValue ?? 0), 0)
          : null;
        const share =
          budget?.budget && committedInBudgetCurrency !== null
            ? Math.round((committedInBudgetCurrency / budget.budget) * 100)
            : null;
        const overdue = contracts.flatMap((c) => overduePayments(c, today)).length;
        return (
          <div className="c-stack">
            <div className="c-stat-grid" role="group" aria-label="Satın alma özeti">
              <StatTile
                label="Sözleşmeler"
                value={contracts.length}
                detail={`${contracts.filter((c) => c.status === 'active').length} yürürlükte`}
              />
              <StatTile
                label="Taahhüt"
                value={formatTotals(totalsByCurrency(live, (c) => c.totalValue))}
                detail={
                  share !== null && budget?.budget
                    ? `Proje bütçesinin %${share}'i (${formatCurrency(budget.budget, budget.currency)})`
                    : 'taslak ve feshedilenler hariç'
                }
                tone={share !== null && share > 100 ? 'warning' : 'default'}
              />
              <StatTile
                label="Ödenen"
                value={formatTotals(totalsByCurrency(contracts, (c) => paymentSummary(c).paid))}
              />
              <StatTile
                label="Gecikmiş ödeme"
                value={overdue}
                tone={overdue > 0 ? 'warning' : 'default'}
              />
            </div>
            <SectionCard
              title="Satın alma ve sözleşmeler"
              description="Bu proje için yapılan satın almalar, dönemleri, bedelleri ve ödemeleri."
              actions={
                <>
                  <ExcelExportButton
                    title={`${project.name} — sözleşmeler`}
                    disabled={contracts.length === 0}
                    build={exportContracts(contracts, { title: `${project.name} sözleşmeleri` })}
                  />
                  <SmallCreateAction
                    to={paths.contracts.create(project.id)}
                    label="Sözleşme ekle"
                    privilege="contracts:edit"
                  />
                </>
              }
            >
              <ContractTable
                contracts={contracts}
                vendors={vendorById}
                showProject={false}
                emptyState={
                  <EmptyState
                    compact
                    title={`${project.name} için kayıtlı satın alma yok`}
                    description="Lisans, hizmet veya donanım alımlarını sözleşmeleriyle birlikte kaydedin."
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
