import { DetailList } from '@/components/data-display/DetailList';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import type { StakeholderRole } from '@/domains/shared/types';
import { findPrimaryRoleHolder } from '@/domains/shared/utils/roles';
import { formatDate } from '@/lib/dates';
import type { Project } from '../../types';
import { PercentMeter } from '@/components/data-display/PercentMeter';
import { useMasterData } from '@/domains/master-data/context';

/** Who leads the project, when it lands and how far along it is. */
export function ProjectKeyFacts({ project }: { project: Project }) {
  const masterData = useMasterData();
  const people = usePeopleById();
  const businessUnits = useBusinessUnitsById();
  const person = (role: StakeholderRole) => {
    const id = findPrimaryRoleHolder(project.roles, role);
    return id ? <PersonSummary person={people.data?.get(id)} fallbackId={id} /> : null;
  };
  const { timeline } = project;

  return (
    <section aria-label="Temel bilgiler" className="c-key-facts">
      <DetailList
        layout="grid"
        items={[
          { label: 'Sponsor', value: person('sponsor'), emptyText: 'Atanmamış' },
          { label: 'Proje yöneticisi', value: person('project-manager'), emptyText: 'Atanmamış' },
          { label: 'Teknik lider', value: person('technical-lead'), emptyText: 'Atanmamış' },
          {
            label: 'İş birimi',
            value: project.businessUnitId
              ? businessUnits.data?.get(project.businessUnitId)?.name
              : null,
          },
          {
            label: 'Planlanan zaman çizelgesi',
            value: `${formatDate(timeline.plannedStartDate)} – ${formatDate(timeline.plannedEndDate)}`,
          },
          {
            label: `İlerleme · ${masterData.label('projectPhases', project.currentPhase)}`,
            value: (
              <PercentMeter value={project.progressPercentage} label={`${project.name} ilerleme`} />
            ),
          },
        ]}
      />
    </section>
  );
}
