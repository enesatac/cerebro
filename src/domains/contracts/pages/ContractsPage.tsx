import { Button } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { StatTile } from '@/components/data-display/StatTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { Toolbar } from '@/components/layout/Toolbar';
import { Can } from '@/domains/auth/components/Can';
import { CreateAction } from '@/domains/auth/components/RecordActions';
import { useMasterData } from '@/domains/master-data/context';
import { useProjectOptions } from '@/domains/projects/api/queries';
import { useTabParam } from '@/hooks/useTabParam';
import { toIsoDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { includesFolded } from '@/lib/search';
import { parseId } from '@/lib/urlParams';
import { describeFilters } from '@/lib/xlsxTypes';
import { useContracts, useVendors } from '../api/queries';
import { ContractTable } from '../components/ContractTable';
import { UpcomingEventsTable } from '../components/UpcomingEventsTable';
import { useContractExport } from '../components/useContractExport';
import { VendorDialog } from '../components/VendorDialog';
import { VendorTable } from '../components/VendorTable';
import type { Contract, Vendor } from '../types';
import {
  contractAlerts,
  END_WARNING_DAYS,
  overduePayments,
  totalsByCurrency,
  upcomingEvents,
} from '../utils/contractSchedule';
import { vendorSheet } from '../utils/contractExport';

const TAB_IDS = ['contracts', 'upcoming', 'vendors'] as const;
const UPCOMING_DAYS = 120;

interface Filters {
  search: string;
  status: string | null;
  type: string | null;
  vendorId: number | null;
  projectId: number | null;
}

/**
 * Purchases and contracts across all projects: what is in force, what it costs, what is coming
 * up (ends, notice deadlines, payments) and who the suppliers are.
 */
export default function ContractsPage() {
  const today = toIsoDate(new Date());
  const [params, setParams] = useSearchParams();
  const [tab, selectTab] = useTabParam(TAB_IDS);
  const filters: Filters = {
    search: params.get('q') ?? '',
    status: params.get('status') || null,
    type: params.get('type') || null,
    vendorId: parseId(params.get('vendor')),
    projectId: parseId(params.get('project')),
  };
  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    const result = new URLSearchParams(params);
    const set = (key: string, value: string | number | null) =>
      value === null || value === '' ? result.delete(key) : result.set(key, String(value));
    set('q', next.search.trim());
    set('status', next.status);
    set('type', next.type);
    set('vendor', next.vendorId);
    set('project', next.projectId);
    setParams(result, { replace: true });
  };

  const masterData = useMasterData();
  const contracts = useContracts();
  const vendors = useVendors();
  const projects = useProjectOptions();
  const [editingVendor, setEditingVendor] = useState<Vendor | 'new' | null>(null);
  const vendorById = useMemo(
    () => new Map((vendors.data ?? []).map((vendor) => [vendor.id, vendor])),
    [vendors.data],
  );
  const exportContracts = useContractExport(vendorById);

  const all = contracts.data ?? [];
  const shown = all.filter(
    (c) =>
      (!filters.status || c.status === filters.status) &&
      (!filters.type || c.type === filters.type) &&
      (filters.vendorId === null || c.vendorId === filters.vendorId) &&
      (filters.projectId === null || c.projectId === filters.projectId) &&
      (!filters.search ||
        [c.code, c.title, c.purchaseOrderNumber, vendorById.get(c.vendorId)?.name ?? ''].some(
          (text) => includesFolded(text, filters.search),
        )),
  );
  const active = all.filter((c) => c.status === 'active');
  const ending = active.filter((c) =>
    contractAlerts(c, today).some((a) => a.kind === 'ending' || a.kind === 'expired-active'),
  );
  const overdue = all.flatMap((c) => overduePayments(c, today));
  const contractCount = (vendorId: number) => all.filter((c) => c.vendorId === vendorId).length;
  const activeFilters = [
    filters.search,
    filters.status,
    filters.type,
    filters.vendorId,
    filters.projectId,
  ].filter((v) => v !== null && v !== '').length;

  const panel = (id: (typeof TAB_IDS)[number]) => {
    if (contracts.isPending || vendors.isPending) {
      return <LoadingState label="Sözleşmeler yükleniyor" rows={6} />;
    }
    if (contracts.isError || vendors.isError) {
      return (
        <ErrorState
          title="Sözleşmeler yüklenemedi"
          onRetry={() => {
            void contracts.refetch();
            void vendors.refetch();
          }}
        />
      );
    }
    if (id === 'vendors') {
      return (
        <div className="c-stack c-stack--s">
          <Toolbar
            label="Tedarikçiler"
            end={
              <>
                <ExcelExportButton
                  title="Tedarikçiler"
                  disabled={!vendors.data?.length}
                  build={() => [vendorSheet(vendors.data ?? [], contractCount)]}
                />
                <Can privilege="contracts:edit">
                  <Button
                    size="small"
                    startContent={<AddIconOutlinedRounded aria-hidden="true" />}
                    onClick={() => setEditingVendor('new')}
                  >
                    Tedarikçi ekle
                  </Button>
                </Can>
              </>
            }
          >
            <span className="c-muted">{vendors.data?.length ?? 0} tedarikçi</span>
          </Toolbar>
          <VendorTable
            vendors={vendors.data ?? []}
            contractCount={contractCount}
            onEdit={setEditingVendor}
          />
        </div>
      );
    }
    if (id === 'upcoming') {
      const events = upcomingEvents(all, today, UPCOMING_DAYS);
      return (
        <div className="c-stack c-stack--s">
          <p className="c-muted">
            Yürürlükteki sözleşmelerin önümüzdeki {UPCOMING_DAYS} gündeki bitiş, son bildirim ve
            ödeme tarihleri; vadesi geçmiş ödemeler en üstte.
          </p>
          <UpcomingEventsTable events={events} vendors={vendorById} />
        </div>
      );
    }
    return (
      <div className="c-stack c-stack--s">
        <Toolbar
          label="Sözleşmeleri filtrele"
          end={
            <>
              <FilterSummary
                summary={`${shown.length} sözleşme`}
                activeFilterCount={activeFilters}
                onReset={() =>
                  update({ search: '', status: null, type: null, vendorId: null, projectId: null })
                }
              />
              <ExcelExportButton
                title="Sözleşmeler"
                disabled={shown.length === 0}
                build={exportContracts(shown, {
                  title: 'Sözleşmeler',
                  subtitle: describeFilters([
                    ['Arama', filters.search],
                    [
                      'Durum',
                      filters.status && masterData.label('contractStatuses', filters.status),
                    ],
                    ['Tür', filters.type && masterData.label('contractTypes', filters.type)],
                    ['Tedarikçi', filters.vendorId ? vendorById.get(filters.vendorId)?.name : null],
                    ['Proje', projects.find((p) => p.value === String(filters.projectId))?.label],
                  ]),
                })}
              />
            </>
          }
        >
          <SearchField
            label="Sözleşme ara"
            placeholder="Başlık, kod, sipariş no veya tedarikçi"
            value={filters.search}
            onCommit={(search) => update({ search })}
          />
          <FilterSelect
            label="Durum"
            allLabel="Tüm durumlar"
            value={filters.status}
            options={masterData.options('contractStatuses', filters.status)}
            onChange={(status) => update({ status })}
          />
          <FilterSelect
            label="Tür"
            allLabel="Tüm türler"
            value={filters.type}
            options={masterData.options('contractTypes', filters.type)}
            onChange={(type) => update({ type })}
          />
          <FilterSelect
            label="Tedarikçi"
            allLabel="Tüm tedarikçiler"
            value={filters.vendorId}
            options={(vendors.data ?? []).map((v) => ({ value: String(v.id), label: v.name }))}
            onChange={(value) => update({ vendorId: parseId(value) })}
          />
          <FilterSelect
            label="Proje"
            allLabel="Tüm projeler"
            value={filters.projectId}
            options={projects}
            onChange={(value) => update({ projectId: parseId(value) })}
          />
        </Toolbar>
        <ContractTable
          contracts={shown}
          vendors={vendorById}
          emptyState={
            <EmptyState
              compact
              title={activeFilters > 0 ? 'Bu filtrelere uyan sözleşme yok' : 'Henüz sözleşme yok'}
            />
          }
        />
      </div>
    );
  };

  return (
    <div className="c-stack">
      <PageHeader
        title="Satın alma ve sözleşmeler"
        subtitle="Projeler için yapılan satın almalar: kimden, ne kadar süreyle, hangi bedelle; ödeme planı, yaklaşan bitiş ve ihbar tarihleri."
        actions={
          <CreateAction
            to={paths.contracts.create()}
            label="Sözleşme ekle"
            privilege="contracts:edit"
          />
        }
      />
      <div className="c-stat-grid" role="group" aria-label="Sözleşme özeti">
        <StatTile label="Yürürlükte" value={active.length} detail={`${all.length} sözleşmeden`} />
        {totalsByCurrency(active, (c: Contract) => c.totalValue).map((total) => (
          <StatTile
            key={total.currency}
            label={`Yürürlükteki taahhüt (${total.currency})`}
            value={formatCurrency(total.amount, total.currency)}
            detail={`${active.filter((c) => c.currency === total.currency).length} sözleşme`}
          />
        ))}
        <StatTile
          label={`${END_WARNING_DAYS} gün içinde biten`}
          value={ending.length}
          tone={ending.length > 0 ? 'warning' : 'default'}
          to={paths.contracts.list('upcoming')}
        />
        <StatTile
          label="Gecikmiş ödeme"
          value={overdue.length}
          detail="vadesi geçmiş taksit"
          tone={overdue.length > 0 ? 'warning' : 'default'}
          to={paths.contracts.list('upcoming')}
        />
      </div>
      <SectionCard title="Sözleşmeler">
        <DetailTabs
          label="Sözleşme görünümleri"
          tabs={[
            { id: 'contracts', label: 'Sözleşmeler', count: contracts.data ? all.length : null },
            { id: 'upcoming', label: 'Yaklaşan tarihler' },
            { id: 'vendors', label: 'Tedarikçiler', count: vendors.data?.length ?? null },
          ]}
          active={tab}
          onSelect={selectTab}
          renderPanel={panel}
        />
      </SectionCard>
      {editingVendor && (
        <VendorDialog
          vendor={editingVendor === 'new' ? null : editingVendor}
          onClose={() => setEditingVendor(null)}
        />
      )}
    </div>
  );
}
