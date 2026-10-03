import type { Privilege, PrivilegeModule } from '@/domains/auth/types';
import type { AttachmentOwnerType } from '../types';

/** Files follow the privileges of the screen that owns the record. */
const OWNER_MODULE: Record<AttachmentOwnerType, PrivilegeModule> = {
  application: 'applications',
  project: 'projects',
  team: 'teams',
  technology: 'technologies',
  risk: 'risks',
  escalation: 'risks',
  decision: 'risks',
  demand: 'demandManagement',
  contract: 'contracts',
};

/**
 * The privilege needed to change (`edit`) or remove (`delete`) files on a record of `owner`.
 * Demand requesters have an ownership rule on top (see `demandAccess`).
 */
export const attachmentPrivilege = (owner: AttachmentOwnerType, level: 'edit' | 'delete') =>
  `${OWNER_MODULE[owner]}:${level}` as Privilege;

/**
 * Who may read the files of a record: whoever may view its screen. Demands are read by requesters
 * (`demands:view`) as well as the portfolio office.
 */
export const attachmentViewPrivileges = (owner: AttachmentOwnerType): Privilege[] =>
  owner === 'demand'
    ? ['demands:view', 'demandManagement:view']
    : [`${OWNER_MODULE[owner]}:view` as Privilege];
