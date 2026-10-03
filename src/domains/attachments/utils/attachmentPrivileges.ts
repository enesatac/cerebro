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
};

/**
 * The privilege needed to change (`edit`) or remove (`delete`) files on a record of `owner`.
 * Demand requesters have an ownership rule on top (see `demandAccess`).
 */
export const attachmentPrivilege = (owner: AttachmentOwnerType, level: 'edit' | 'delete') =>
  `${OWNER_MODULE[owner]}:${level}` as Privilege;
