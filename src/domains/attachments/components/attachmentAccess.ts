import { usePrivilege } from '@/domains/auth/api/queries';
import type { AttachmentOwnerType } from '../types';
import { attachmentPrivilege } from '../utils/attachmentPrivileges';

/** What the viewer may do with a record's files (beyond opening and downloading them). */
export interface AttachmentAccess {
  /** Upload, retype and describe. */
  edit: boolean;
  remove: boolean;
}

/**
 * The owning screen's privileges by default; records with their own rule (a requester's demand)
 * pass `override`. The repository enforces the same rule.
 */
export function useAttachmentAccess(
  owner: AttachmentOwnerType,
  override?: AttachmentAccess,
): AttachmentAccess {
  const edit = usePrivilege(attachmentPrivilege(owner, 'edit'));
  const remove = usePrivilege(attachmentPrivilege(owner, 'delete'));
  return override ?? { edit, remove };
}
