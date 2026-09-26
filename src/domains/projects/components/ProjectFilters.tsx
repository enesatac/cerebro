import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { useBusinessUnits } from '@/domains/business-units/api/queries';
import { useTeams } from '@/domains/teams/api/queries';
import { PROJECT_HEALTHS, PROJECT_STATUSES } from '../types';
import {
  PROJECT_HEALTH_PRESENTATION,
  PROJECT_STATUS_PRESENTATION,
} from '../utils/projectPresentation';
import { countActiveProjectFilters, type ProjectListState } from '../utils/projectListParams';

const STATUS_OPTIONS = PROJECT_STATUSES.map((value) => ({
  value,
  label: PROJECT_STATUS_PRESENTATION[value].label,
}));
const HEALTH_OPTIONS = PROJECT_HEALTHS.map((value) => ({
  value,
  label: PROJECT_HEALTH_PRESENTATION[value].label,
}));

type FilterPatch = Partial<Omit<ProjectListState, 'sort' | 'page' | 'pageSize'>>;

interface ProjectFiltersProps {
  state: ProjectListState;
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
  resultSummary: string;
}

export function ProjectFilters({ state, onChange, onReset, resultSummary }: ProjectFiltersProps) {
  const businessUnits = useBusinessUnits();
  const teams = useTeams();

  return (
    <Toolbar
      label="Filter projects"
      end={
        <FilterSummary
          summary={resultSummary}
          activeFilterCount={countActiveProjectFilters(state)}
          onReset={onReset}
        />
      }
    >
      <SearchField
        placeholder="Name, code, description or tag"
        value={state.search}
        onCommit={(search) => onChange({ search })}
      />
      <FilterSelect
        label="Status"
        allLabel="All statuses"
        value={state.status}
        options={STATUS_OPTIONS}
        onChange={(value) => onChange({ status: value as ProjectListState['status'] })}
      />
      <FilterSelect
        label="Health"
        allLabel="All health states"
        value={state.health}
        options={HEALTH_OPTIONS}
        onChange={(value) => onChange({ health: value as ProjectListState['health'] })}
      />
      <FilterSelect
        label="Business unit"
        allLabel="All business units"
        value={state.businessUnitId}
        options={(businessUnits.data ?? []).map((unit) => ({ value: unit.id, label: unit.name }))}
        onChange={(value) => onChange({ businessUnitId: value })}
        disabled={!businessUnits.data}
      />
      <FilterSelect
        label="Delivery team"
        allLabel="All teams"
        value={state.teamId}
        options={(teams.data ?? []).map((team) => ({ value: team.id, label: team.name }))}
        onChange={(value) => onChange({ teamId: value })}
        disabled={!teams.data}
      />
    </Toolbar>
  );
}
