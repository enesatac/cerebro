import { useSearchParams } from 'react-router';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { Toolbar } from '@/components/layout/Toolbar';
import { useEscalations } from '@/domains/escalations/api/queries';
import { EscalationTable } from '@/domains/escalations/components/EscalationTable';
import { ESCALATION_STATUSES } from '@/domains/escalations/types';
import {
  ESCALATION_STATUS_PRESENTATION,
  isActiveEscalation,
} from '@/domains/escalations/utils/escalationPresentation';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useTabParam } from '@/hooks/useTabParam';
import { pluralize } from '@/lib/format';
import { oneOf } from '@/lib/urlParams';
import { useRisks } from '../api/queries';
import { RiskTable } from '../components/RiskTable';
import { RISK_STATUSES } from '../types';
import { prioritise } from '../utils/prioritise';
import { isActiveRisk, RISK_STATUS_PRESENTATION } from '../utils/riskPresentation';
import { paths } from '@/app/router/paths';
import { CreateAction } from '@/domains/auth/components/RecordActions';

const TABS = [
  { id: 'escalations', label: 'Eskalasyonlar' },
  { id: 'risks', label: 'Riskler' },
] as const;
const TAB_IDS = TABS.map((tab) => tab.id);
const SEVERITY_OPTIONS = CRITICALITIES.map((value) => ({
  value,
  label: CRITICALITY_PRESENTATION[value].label,
}));
const ALL_FILTER = {};

/** Severity + status filters shared by both registers; status options differ per register. */
function useRegisterFilters<S extends string>(statuses: readonly S[]) {
  const [params, setParams] = useSearchParams();
  const severity = oneOf(CRITICALITIES, params.get('severity'));
  const status = oneOf(statuses, params.get('status'));
  const set = (key: 'severity' | 'status', value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const reset = () => {
    const next = new URLSearchParams(params);
    next.delete('severity');
    next.delete('status');
    setParams(next, { replace: true });
  };
  return { severity, status, set, reset, activeCount: [severity, status].filter(Boolean).length };
}

function EscalationRegister() {
  const query = useEscalations(ALL_FILTER);
  const filters = useRegisterFilters(ESCALATION_STATUSES);
  return (
    <QueryView
      query={query}
      loadingLabel="Eskalasyonlar yükleniyor"
      errorTitle="Eskalasyonlar yüklenemedi"
    >
      {(all) => {
        const visible = prioritise(
          all.filter(
            (e) =>
              (!filters.severity || e.severity === filters.severity) &&
              (!filters.status || e.status === filters.status),
          ),
          (e) => isActiveEscalation(e.status),
        );
        return (
          <>
            <Toolbar
              label="Eskalasyonları filtrele"
              end={
                <FilterSummary
                  summary={`${pluralize(visible.length, 'eskalasyon')} · ${all.filter((e) => isActiveEscalation(e.status)).length} aktif`}
                  activeFilterCount={filters.activeCount}
                  onReset={filters.reset}
                />
              }
            >
              <FilterSelect
                label="Durum"
                allLabel="Tüm durumlar"
                value={filters.status}
                options={ESCALATION_STATUSES.map((value) => ({
                  value,
                  label: ESCALATION_STATUS_PRESENTATION[value].label,
                }))}
                onChange={(value) => filters.set('status', value)}
              />
              <FilterSelect
                label="Önem derecesi"
                allLabel="Tüm önem dereceleri"
                value={filters.severity}
                options={SEVERITY_OPTIONS}
                onChange={(value) => filters.set('severity', value)}
              />
            </Toolbar>
            <EscalationTable
              escalations={visible}
              showRelated
              pagination
              emptyState={<EmptyState compact title="Bu filtrelere uyan eskalasyon yok" />}
            />
          </>
        );
      }}
    </QueryView>
  );
}

function RiskRegister() {
  const query = useRisks(ALL_FILTER);
  const filters = useRegisterFilters(RISK_STATUSES);
  return (
    <QueryView query={query} loadingLabel="Riskler yükleniyor" errorTitle="Riskler yüklenemedi">
      {(all) => {
        const visible = prioritise(
          all.filter(
            (r) =>
              (!filters.severity || r.severity === filters.severity) &&
              (!filters.status || r.status === filters.status),
          ),
          (r) => isActiveRisk(r.status),
        );
        return (
          <>
            <Toolbar
              label="Riskleri filtrele"
              end={
                <FilterSummary
                  summary={`${pluralize(visible.length, 'risk')} · ${all.filter((r) => isActiveRisk(r.status)).length} aktif`}
                  activeFilterCount={filters.activeCount}
                  onReset={filters.reset}
                />
              }
            >
              <FilterSelect
                label="Durum"
                allLabel="Tüm durumlar"
                value={filters.status}
                options={RISK_STATUSES.map((value) => ({
                  value,
                  label: RISK_STATUS_PRESENTATION[value].label,
                }))}
                onChange={(value) => filters.set('status', value)}
              />
              <FilterSelect
                label="Önem derecesi"
                allLabel="Tüm önem dereceleri"
                value={filters.severity}
                options={SEVERITY_OPTIONS}
                onChange={(value) => filters.set('severity', value)}
              />
            </Toolbar>
            <RiskTable
              risks={visible}
              showRelated
              pagination
              emptyState={<EmptyState compact title="Bu filtrelere uyan risk yok" />}
            />
          </>
        );
      }}
    </QueryView>
  );
}

export default function RisksAndEscalationsPage() {
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  const [params, setParams] = useSearchParams();

  // Status values differ between registers, so filters reset when switching tabs.
  const switchTab = (tab: string) => {
    if (tab !== activeTab && (params.has('status') || params.has('severity'))) {
      setParams(tab === 'escalations' ? {} : { tab }, { replace: true });
      return;
    }
    selectTab(tab);
  };

  return (
    <div className="c-stack">
      <PageHeader
        title="Riskler ve Eskalasyonlar"
        subtitle="Portföy genelindeki operasyonel sorunlar. Aktif ve en ciddi kayıtlar önce listelenir."
        actions={
          activeTab === 'risks' ? (
            <CreateAction to={paths.riskForms.create()} label="Risk kaydet" />
          ) : (
            <CreateAction to={paths.escalationForms.create()} label="Eskalasyon aç" />
          )
        }
      />
      <DetailTabs
        label="Kayıt defterleri"
        tabs={TABS}
        active={activeTab}
        onSelect={switchTab}
        renderPanel={(tab) => (tab === 'escalations' ? <EscalationRegister /> : <RiskRegister />)}
      />
    </div>
  );
}
