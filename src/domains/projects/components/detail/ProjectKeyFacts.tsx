import { DetailList } from '@/components/data-display/DetailList';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import type { StakeholderRole } from '@/domains/shared/types';
import { findPrimaryRoleHolder } from '@/domains/shared/utils/roles';
import { formatDate } from '@/lib/dates';
import type { Project } from '../../types';
import { PROJECT_PHASE_LABELS } from '../../utils/projectPresentation';
import { PercentMeter } from '@/components/data-display/PercentMeter';

/** Who leads the project, when it lands and how far along it is. */
export function ProjectKeyFacts({ project }: { project: Project }) {
  const people = usePeopleById();
  const businessUnits = useBusinessUnitsById();
  const person = (role: StakeholderRole) => {
    const id = findPrimaryRoleHolder(project.roles, role);
    return id ? <PersonSummary person={people.data?.get(id)} fallbackId={id} /> : null;
  };
  const { timeline } = project;

  return (
    <section aria-label="Key facts" className="c-key-facts">
      <DetailList
        layout="grid"
        items={[
          { label: 'Sponsor', value: person('sponsor'), emptyText: 'Unassigned' },
          { label: 'Project manager', value: person('project-manager'), emptyText: 'Unassigned' },
          { label: 'Technical lead', value: person('technical-lead'), emptyText: 'Unassigned' },
          {
            label: 'Business unit',
            value: project.businessUnitId
              ? businessUnits.data?.get(project.businessUnitId)?.name
              : null,
          },
          {
            label: 'Planned timeline',
            value: `${formatDate(timeline.plannedStartDate)} – ${formatDate(timeline.plannedEndDate)}`,
          },
          {
            label: `Progress · ${PROJECT_PHASE_LABELS[project.currentPhase]}`,
            value: (
              <PercentMeter value={project.progressPercentage} label={`${project.name} progress`} />
            ),
          },
        ]}
      />
    </section>
  );
}
