import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteAttachment } from '../api/mutations';
import type { Attachment } from '../types';

export function AttachmentDeleteAction({ record }: { record: Attachment }) {
  const { attachments } = useRepositories();
  const remove = useDeleteAttachment();
  return (
    <Can permission="portfolio:delete">
      <DeleteAction
        entityLabel="ek"
        entityName={record.fileName}
        impactKey={['attachment', record.id]}
        loadImpact={() => attachments.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        compact
      />
    </Can>
  );
}
