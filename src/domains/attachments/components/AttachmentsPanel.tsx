import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { useAttachments } from '../api/queries';
import { REQUIRED_DOCUMENTS, type AttachmentOwner } from '../types';
import { useAttachmentAccess, type AttachmentAccess } from './attachmentAccess';
import { AttachmentTable } from './AttachmentTable';
import { AttachmentUploader } from './AttachmentUploader';
import { RequiredDocuments } from './RequiredDocuments';

export interface AttachmentsPanelProps {
  owner: AttachmentOwner;
  /** Record name, used in titles and the Excel export ("Ödeme Geçidi"). */
  ownerName: string;
  /** Overrides the portfolio permissions for records with their own rule (demands). */
  access?: AttachmentAccess;
  /** Document type preselected in the upload area. */
  defaultType?: string;
}

/**
 * Everything about a record's files: the required-documents checklist (where the record type has
 * one), the upload area for editors, and the files themselves.
 */
export function AttachmentsPanel({
  owner,
  ownerName,
  access: override,
  defaultType,
}: AttachmentsPanelProps) {
  const query = useAttachments(owner);
  const access = useAttachmentAccess(override);
  const required = REQUIRED_DOCUMENTS[owner.type] ?? [];

  if (query.isPending) return <LoadingState label="Ekler yükleniyor" rows={3} />;
  if (query.isError) {
    return <ErrorState title="Ekler yüklenemedi" onRetry={() => void query.refetch()} />;
  }
  const attachments = query.data;
  return (
    <div className="c-stack c-stack--s">
      {required.length > 0 && (
        <RequiredDocuments
          owner={owner}
          required={required}
          attachments={attachments}
          canEdit={access.edit}
        />
      )}
      {access.edit && <AttachmentUploader owner={owner} defaultType={defaultType} />}
      {attachments.length === 0 && required.length === 0 ? (
        <EmptyState compact title="Henüz dosya eklenmedi" />
      ) : (
        <AttachmentTable
          attachments={attachments}
          exportTitle={`${ownerName} — ekler`}
          access={access}
        />
      )}
    </div>
  );
}
