import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { AttachmentOwner, AttachmentOwnerType } from '../types';

export const attachmentKeys = {
  all: ['attachments'] as const,
  list: (owner: AttachmentOwner) => [...attachmentKeys.all, owner.type, owner.id] as const,
  counts: (type: AttachmentOwnerType) => [...attachmentKeys.all, 'counts', type] as const,
};

export function useAttachments(owner: AttachmentOwner) {
  const { attachments } = useRepositories();
  return useQuery({
    queryKey: attachmentKeys.list(owner),
    queryFn: () => attachments.list(owner),
  });
}

/** Files per record of a type (register columns). */
export function useAttachmentCounts(type: AttachmentOwnerType) {
  const { attachments } = useRepositories();
  return useQuery({
    queryKey: attachmentKeys.counts(type),
    queryFn: () => attachments.countByOwner(type),
  });
}
