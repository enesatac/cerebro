import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { useBusinessUnits } from '@/domains/business-units/api/queries';
import { useTeams } from '@/domains/teams/api/queries';
import { countActiveProjectFilters, type ProjectListState } from '../utils/projectListParams';
import { useMasterData } from '@/domains/master-data/context';
import { parseId } from '@/lib/urlParams';

type FilterPatch = Partial<Omit<ProjectListState, 'sort' | 'page' | 'pageSize'>>;

interface ProjectFiltersProps {
  state: ProjectListState;
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
  resultSummary: string;
}

export function ProjectFilters({ state, onChange, onReset, resultSummary }: ProjectFiltersProps) {
  const masterData = useMasterData();
  const businessUnits = useBusinessUnits();
  const teams = useTeams();

  return (
    <Toolbar
      label="Projeleri filtrele"
      end={
        <FilterSummary
          summary={resultSummary}
          activeFilterCount={countActiveProjectFilters(state)}
          onReset={onReset}
        />
      }
    >
      <SearchField
        placeholder="Ad, kod, açıklama veya etiket"
        value={state.search}
        onCommit={(search) => onChange({ search })}
      />
      <FilterSelect
        label="Durum"
        allLabel="Tüm durumlar"
        value={state.status}
        options={masterData.options('projectStatuses', state.status)}
        onChange={(value) => onChange({ status: value as ProjectListState['status'] })}
      />
      <FilterSelect
        label="Sağlık"
        allLabel="Tüm sağlık durumları"
        value={state.health}
        options={masterData.options('projectHealths', state.health)}
        onChange={(value) => onChange({ health: value as ProjectListState['health'] })}
      />
      <FilterSelect
        label="İş birimi"
        allLabel="Tüm iş birimleri"
        value={state.businessUnitId}
        options={(businessUnits.data ?? []).map((unit) => ({
          value: String(unit.id),
          label: unit.name,
        }))}
        onChange={(value) => onChange({ businessUnitId: parseId(value) })}
        disabled={!businessUnits.data}
      />
      <FilterSelect
        label="Teslimat ekibi"
        allLabel="Tüm ekipler"
        value={state.teamId}
        options={(teams.data ?? []).map((team) => ({ value: String(team.id), label: team.name }))}
        onChange={(value) => onChange({ teamId: parseId(value) })}
        disabled={!teams.data}
      />
    </Toolbar>
  );
}
