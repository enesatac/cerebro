import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { AttachmentUpdate, AttachmentUpload } from '../types';

export function useUploadAttachment() {
  const { attachments } = useRepositories();
  return useRepositoryMutation((input: AttachmentUpload) => attachments.upload(input), {
    successTitle: (attachment) => `${attachment.fileName} yüklendi`,
  });
}

export function useUpdateAttachment(id: EntityId) {
  const { attachments } = useRepositories();
  return useRepositoryMutation((input: AttachmentUpdate) => attachments.update(id, input), {
    successTitle: () => 'Ek güncellendi',
  });
}

export function useDeleteAttachment() {
  const { attachments } = useRepositories();
  return useRepositoryMutation((id: EntityId) => attachments.remove(id), {
    successTitle: () => 'Ek silindi',
  });
}
