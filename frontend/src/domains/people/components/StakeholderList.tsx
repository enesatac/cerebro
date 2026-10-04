import { paths } from '@/app/router/paths';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import type { RoleAssignment, TeamAssignment } from '@/domains/shared/types';
import { useTeamsById } from '@/domains/teams/api/queries';
import { usePeopleById } from '../api/queries';
import { PersonSummary } from './PersonSummary';
import { useMasterData } from '@/domains/master-data/context';

interface StakeholderListProps {
  roles: readonly RoleAssignment[];
  teams: readonly TeamAssignment[];
}

/** People (by contextual role, owners first) and teams (by responsibility) with contact details. */
export function StakeholderList({ roles, teams }: StakeholderListProps) {
  const masterData = useMasterData();
  const people = usePeopleById();
  const teamsById = useTeamsById();
  // Owners first: roles follow the order administrators give them in master data.
  const roleOrder = masterData.items('stakeholderRoles').map((item) => item.code);
  const rank = (role: string) =>
    roleOrder.includes(role) ? roleOrder.indexOf(role) : roleOrder.length;
  const orderedRoles = [...roles].sort((a, b) => rank(a.role) - rank(b.role));

  return (
    <DetailList
      items={[
        ...orderedRoles.map((assignment) => ({
          label: masterData.label('stakeholderRoles', assignment.role),
          value: (
            <PersonSummary
              person={people.data?.get(assignment.personId)}
              fallbackId={assignment.personId}
              showEmail
            />
          ),
        })),
        ...teams.map((assignment) => {
          const team = teamsById.data?.get(assignment.teamId);
          return {
            label: `${masterData.label('teamResponsibilities', assignment.responsibility)} ekibi`,
            value: (
              <span className="c-cell-stack">
                <EntityLink to={paths.teams.detail(assignment.teamId)}>
                  {team?.name ?? assignment.teamId}
                </EntityLink>
                {team && (
                  <span className="c-muted c-cell-stack__secondary">
                    {[team.contactEmail, team.chatChannel].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
            ),
          };
        }),
      ]}
    />
  );
}
