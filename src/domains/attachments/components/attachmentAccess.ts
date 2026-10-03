import { usePermission } from '@/domains/auth/api/queries';

/** What the viewer may do with a record's files (beyond opening and downloading them). */
export interface AttachmentAccess {
  /** Upload, retype and describe. */
  edit: boolean;
  remove: boolean;
}

/**
 * Portfolio permissions by default; records with their own rule (a requester's demand) pass
 * `override`. The repository enforces the same rule.
 */
export function useAttachmentAccess(override?: AttachmentAccess): AttachmentAccess {
  const edit = usePermission('portfolio:edit');
  const remove = usePermission('portfolio:delete');
  return override ?? { edit, remove };
}
