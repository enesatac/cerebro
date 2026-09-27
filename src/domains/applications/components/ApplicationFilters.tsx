import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { useBusinessUnits } from '@/domains/business-units/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { useTeams } from '@/domains/teams/api/queries';
import { useTechnologies } from '@/domains/technologies/api/queries';
import { countActiveFilters, type ApplicationListState } from '../utils/applicationListParams';
import { parseId } from '@/lib/urlParams';

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
  const masterData = useMasterData();
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
        options={masterData.options('applicationLifecycles', state.lifecycle)}
        onChange={(value) => onChange({ lifecycle: value as ApplicationListState['lifecycle'] })}
      />
      <FilterSelect
        label="Kritiklik"
        allLabel="Tüm kritiklik düzeyleri"
        value={state.criticality}
        options={masterData.options('criticalities', state.criticality)}
        onChange={(value) =>
          onChange({ criticality: value as ApplicationListState['criticality'] })
        }
      />
      <FilterSelect
        label="Ekip"
        allLabel="Tüm ekipler"
        value={state.teamId}
        options={(teams.data ?? []).map((team) => ({ value: String(team.id), label: team.name }))}
        onChange={(value) => onChange({ teamId: parseId(value) })}
        disabled={!teams.data}
      />
      <FilterSelect
        label="Teknoloji"
        allLabel="Tüm teknolojiler"
        value={state.technologyId}
        options={(technologies.data ?? []).map((tech) => ({
          value: String(tech.id),
          label: tech.name,
        }))}
        onChange={(value) => onChange({ technologyId: parseId(value) })}
        disabled={!technologies.data}
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
    </Toolbar>
  );
}
