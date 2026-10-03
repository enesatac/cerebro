import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { useBusinessUnits } from '@/domains/business-units/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { parseId } from '@/lib/urlParams';
import { describeFilters } from '@/lib/xlsxTypes';
import type { Demand } from '../types';
import { countDemandFilters, type DemandFilters } from '../utils/demandFilters';
import { useDemandExport } from './useDemandExport';

interface DemandFilterBarProps {
  filters: DemandFilters;
  onChange: (patch: Partial<DemandFilters>) => void;
  /** The demands shown under the bar (what gets exported). */
  shown: readonly Demand[];
  exportTitle: string;
  /** Statuses offered in the status filter; all when omitted. */
  statuses?: readonly string[];
}

const RESET: DemandFilters = { search: '', status: null, businessUnitId: null, type: null };

/** Search, status, business unit and type filters with the result count and Excel export. */
export function DemandFilterBar({
  filters,
  onChange,
  shown,
  exportTitle,
  statuses,
}: DemandFilterBarProps) {
  const masterData = useMasterData();
  const units = useBusinessUnits();
  const exportDemands = useDemandExport();
  const statusOptions = masterData
    .options('demandStatuses', filters.status)
    .filter((option) => !statuses || statuses.includes(option.value));
  const unitName = units.data?.find((unit) => unit.id === filters.businessUnitId)?.name;
  return (
    <Toolbar
      label="Talepleri filtrele"
      end={
        <>
          <FilterSummary
            summary={`${shown.length} talep`}
            activeFilterCount={countDemandFilters(filters)}
            onReset={() => onChange(RESET)}
          />
          <ExcelExportButton
            title={exportTitle}
            disabled={shown.length === 0}
            build={exportDemands(shown, {
              title: exportTitle,
              subtitle: describeFilters([
                ['Arama', filters.search],
                ['Durum', filters.status && masterData.label('demandStatuses', filters.status)],
                ['İş birimi', unitName],
                ['Tür', filters.type && masterData.label('demandTypes', filters.type)],
              ]),
            })}
          />
        </>
      }
    >
      <SearchField
        label="Talep ara"
        placeholder="Başlık, kod, ihtiyaç veya kişi"
        value={filters.search}
        onCommit={(search) => onChange({ search })}
      />
      <FilterSelect
        label="Durum"
        allLabel="Tüm durumlar"
        value={filters.status}
        options={statusOptions}
        onChange={(status) => onChange({ status })}
      />
      <FilterSelect
        label="İş birimi"
        allLabel="Tüm iş birimleri"
        value={filters.businessUnitId}
        options={(units.data ?? []).map((unit) => ({ value: String(unit.id), label: unit.name }))}
        onChange={(value) => onChange({ businessUnitId: parseId(value) })}
      />
      <FilterSelect
        label="Tür"
        allLabel="Tüm türler"
        value={filters.type}
        options={masterData.options('demandTypes', filters.type)}
        onChange={(type) => onChange({ type })}
      />
    </Toolbar>
  );
}
