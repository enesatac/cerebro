import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { useBusinessUnits } from '@/domains/business-units/api/queries';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useTeams } from '@/domains/teams/api/queries';
import { useTechnologies } from '@/domains/technologies/api/queries';
import { APPLICATION_LIFECYCLES } from '../types';
import { LIFECYCLE_PRESENTATION } from '../utils/applicationPresentation';
import { countActiveFilters, type ApplicationListState } from '../utils/applicationListParams';

const LIFECYCLE_OPTIONS = APPLICATION_LIFECYCLES.map((value) => ({
  value,
  label: LIFECYCLE_PRESENTATION[value].label,
}));
const CRITICALITY_OPTIONS = CRITICALITIES.map((value) => ({
  value,
  label: CRITICALITY_PRESENTATION[value].label,
}));

type FilterPatch = Partial<Omit<ApplicationListState, 'sort' | 'page' | 'pageSize'>>;

interface ApplicationFiltersProps {
  state: ApplicationListState;
  onChange: (patch: FilterPatch) => void;
  onReset: () => void;
  resultSummary: string;
}

export function ApplicationFilters({
  state,
  onChange,
  onReset,
  resultSummary,
}: ApplicationFiltersProps) {
  const teams = useTeams();
  const technologies = useTechnologies();
  const businessUnits = useBusinessUnits();

  return (
    <Toolbar
      label="Uygulamaları filtrele"
      end={
        <FilterSummary
          summary={resultSummary}
          activeFilterCount={countActiveFilters(state)}
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
        label="Yaşam döngüsü"
        allLabel="Tüm yaşam döngüleri"
        value={state.lifecycle}
        options={LIFECYCLE_OPTIONS}
        onChange={(value) => onChange({ lifecycle: value as ApplicationListState['lifecycle'] })}
      />
      <FilterSelect
        label="Kritiklik"
        allLabel="Tüm kritiklik düzeyleri"
        value={state.criticality}
        options={CRITICALITY_OPTIONS}
        onChange={(value) =>
          onChange({ criticality: value as ApplicationListState['criticality'] })
        }
      />
      <FilterSelect
        label="Ekip"
        allLabel="Tüm ekipler"
        value={state.teamId}
        options={(teams.data ?? []).map((team) => ({ value: team.id, label: team.name }))}
        onChange={(value) => onChange({ teamId: value })}
        disabled={!teams.data}
      />
      <FilterSelect
        label="Teknoloji"
        allLabel="Tüm teknolojiler"
        value={state.technologyId}
        options={(technologies.data ?? []).map((tech) => ({ value: tech.id, label: tech.name }))}
        onChange={(value) => onChange({ technologyId: value })}
        disabled={!technologies.data}
      />
      <FilterSelect
        label="İş birimi"
        allLabel="Tüm iş birimleri"
        value={state.businessUnitId}
        options={(businessUnits.data ?? []).map((unit) => ({ value: unit.id, label: unit.name }))}
        onChange={(value) => onChange({ businessUnitId: value })}
        disabled={!businessUnits.data}
      />
    </Toolbar>
  );
}
