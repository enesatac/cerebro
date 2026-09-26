import { paths } from '@/app/router/paths';
import { DetailList } from '@/components/data-display/DetailList';
import { EntityLink } from '@/components/data-display/EntityLink';
import {
  STAKEHOLDER_ROLES,
  type RoleAssignment,
  type TeamAssignment,
} from '@/domains/shared/types';
import {
  STAKEHOLDER_ROLE_LABELS,
  TEAM_RESPONSIBILITY_LABELS,
} from '@/domains/shared/utils/presentation';
import { useTeamsById } from '@/domains/teams/api/queries';
import { usePeopleById } from '../api/queries';
import { PersonSummary } from './PersonSummary';

interface StakeholderListProps {
  roles: readonly RoleAssignment[];
  teams: readonly TeamAssignment[];
}

/** People (by contextual role, owners first) and teams (by responsibility) with contact details. */
export function StakeholderList({ roles, teams }: StakeholderListProps) {
  const people = usePeopleById();
  const teamsById = useTeamsById();
  const orderedRoles = [...roles].sort(
    (a, b) => STAKEHOLDER_ROLES.indexOf(a.role) - STAKEHOLDER_ROLES.indexOf(b.role),
  );

  return (
    <DetailList
      items={[
        ...orderedRoles.map((assignment) => ({
          label: STAKEHOLDER_ROLE_LABELS[assignment.role],
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
            label: `${TEAM_RESPONSIBILITY_LABELS[assignment.responsibility]} team`,
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
