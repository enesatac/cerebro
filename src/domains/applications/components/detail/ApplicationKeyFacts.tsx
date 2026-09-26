import { DetailList } from '@/components/data-display/DetailList';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { usePeopleById } from '@/domains/people/api/queries';
import { PersonSummary } from '@/domains/people/components/PersonSummary';
import { findPrimaryRoleHolder } from '@/domains/shared/utils/roles';
import { useTeamsById } from '@/domains/teams/api/queries';
import { formatCompactNumber } from '@/lib/format';
import type { Application } from '../../types';
import { HOSTING_MODEL_LABELS } from '../../utils/applicationPresentation';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';

/** The facts someone needs in the first 30 seconds: ownership, organisation, hosting, reach. */
export function ApplicationKeyFacts({ application }: { application: Application }) {
  const people = usePeopleById();
  const teams = useTeamsById();
  const businessUnits = useBusinessUnitsById();

  const person = (role: 'technical-owner' | 'business-owner') => {
    const id = findPrimaryRoleHolder(application.roles, role);
    return id ? <PersonSummary person={people.data?.get(id)} fallbackId={id} /> : null;
  };
  const teamIds = [...new Set(application.teams.map((t) => t.teamId))];
  const teamLinks = teamIds.map((id, index) => (
    <span key={id}>
      {index > 0 && ', '}
      <EntityLink to={paths.teams.detail(id)}>{teams.data?.get(id)?.name ?? id}</EntityLink>
    </span>
  ));

  return (
    <section aria-label="Key facts" className="c-key-facts">
      <DetailList
        layout="grid"
        items={[
          { label: 'Technical owner', value: person('technical-owner'), emptyText: 'Unassigned' },
          { label: 'Business owner', value: person('business-owner'), emptyText: 'Unassigned' },
          {
            label: 'Business unit',
            value: application.businessUnitId
              ? businessUnits.data?.get(application.businessUnitId)?.name
              : null,
          },
          { label: 'Teams', value: teamLinks },
          { label: 'Hosting', value: HOSTING_MODEL_LABELS[application.hosting.model] },
          {
            label: 'Estimated users',
            value: formatCompactNumber(application.estimatedUserCount, ''),
          },
        ]}
      />
    </section>
  );
}
