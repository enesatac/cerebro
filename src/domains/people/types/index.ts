import type { BusinessUnitId } from '@/domains/business-units/types';
import type {
  EntityId,
  EntityRef,
  IsoDate,
  PersonId,
  StakeholderRole,
  TeamResponsibility,
} from '@/domains/shared/types';

/**
 * A person known to Cerebro. Roles are *not* stored here — they exist in the context of an
 * application or project (`RoleAssignment`). Team membership is owned by `Team.memberIds`.
 */
export interface Person {
  id: PersonId;
  fullName: string;
  jobTitle: string;
  email: string;
  businessUnitId: BusinessUnitId | null;
  location: string | null;
}

export type PersonInput = Omit<Person, 'id'>;

/** An application or project a person works on: directly through a role, or through a team. */
export interface PersonWorkItem {
  id: EntityId;
  code: string;
  name: string;
  /** Application lifecycle or project status (master data code). */
  status: string;
  /** Application criticality or project priority (`criticalities` code). */
  criticality: string;
  /** Roles held on the record itself (`stakeholderRoles` codes). */
  roles: StakeholderRole[];
  /** Teams of this person assigned to the record, with their responsibility. */
  viaTeams: { team: EntityRef; responsibility: TeamResponsibility }[];
}

/** A risk, escalation or decision the person owns, raised or took part in. */
export interface PersonGovernanceItem {
  id: EntityId;
  title: string;
  status: string;
  /** Still needs attention (open risk or escalation; decisions are always `false`). */
  active: boolean;
  /** Risk/escalation severity (`criticalities`); `null` for decisions. */
  severity: string | null;
  /** Due date, target resolution date or decision date. */
  date: IsoDate | null;
  /** How the person is involved, e.g. `owner` or `raised`. */
  involvement: ('owner' | 'raised' | 'decider')[];
  applications: EntityRef[];
  projects: EntityRef[];
}

/**
 * Everything a person is mapped to, for the person page: one read instead of a query per
 * register. Built by the repository (a set of joins in a real backend).
 */
export interface PersonWorkload {
  person: Person;
  businessUnit: EntityRef | null;
  teams: { team: EntityRef; manager: boolean; member: boolean }[];
  /** Business units this person heads. */
  headOf: EntityRef[];
  applications: PersonWorkItem[];
  projects: PersonWorkItem[];
  risks: PersonGovernanceItem[];
  escalations: PersonGovernanceItem[];
  decisions: PersonGovernanceItem[];
  /** Current and upcoming project allocations (ending today or later), soonest first. */
  allocations: {
    id: EntityId;
    project: EntityRef;
    role: StakeholderRole;
    startDate: IsoDate;
    endDate: IsoDate;
    percent: number;
  }[];
  /** Allocated work today: parallel allocations and their summed percentage. */
  loadToday: { count: number; percent: number };
  /** Current and upcoming leaves (ending today or later), soonest first. */
  leaves: { id: EntityId; type: string; startDate: IsoDate; endDate: IsoDate }[];
}
