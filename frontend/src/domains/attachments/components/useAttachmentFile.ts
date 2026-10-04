import { useState } from 'react';
import { downloadBlob, openBlob } from '@/lib/download';
import { getErrorMessage } from '@/lib/errors';
import { toaster } from '@/lib/toaster';
import { useRepositories } from '@/services/RepositoryContext';
import type { Attachment } from '../types';
import { isPreviewable } from '../utils/attachmentFiles';

/** Opens (PDF, images) or downloads an attached file; `pendingId` marks the one loading. */
export function useAttachmentFile() {
  const { attachments } = useRepositories();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const run = async (attachment: Attachment, mode: 'open' | 'download') => {
    setPendingId(attachment.id);
    try {
      const blob = await attachments.download(attachment.id);
      const typed = blob.type ? blob : new Blob([blob], { type: attachment.contentType });
      if (mode === 'open' && isPreviewable(attachment.contentType)) openBlob(typed);
      else downloadBlob(typed, attachment.fileName);
    } catch (error) {
      toaster.error({ title: 'Dosya açılamadı', description: getErrorMessage(error) });
    } finally {
      setPendingId(null);
    }
  };
  return {
    pendingId,
    open: (attachment: Attachment) => void run(attachment, 'open'),
    download: (attachment: Attachment) => void run(attachment, 'download'),
  };
}
