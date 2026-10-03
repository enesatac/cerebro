import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteApplication } from '../api/mutations';
import type { Application } from '../types';

interface ApplicationDeleteActionProps {
  /** Only the id and display name are needed, so list rows can pass their read model. */
  record: Pick<Application, 'id' | 'name'>;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function ApplicationDeleteAction({
  record,
  compact,
  onDeleted,
}: ApplicationDeleteActionProps) {
  const { applications } = useRepositories();
  const remove = useDeleteApplication();
  return (
    <Can privilege="applications:delete">
      <DeleteAction
        entityLabel="uygulama"
        entityName={record.name}
        impactKey={['application', record.id]}
        loadImpact={() => applications.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
