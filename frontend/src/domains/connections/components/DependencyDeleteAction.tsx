import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteDependency } from '../api/mutations';
import type { ApplicationDependency } from '../types';

interface DependencyDeleteActionProps {
  record: ApplicationDependency;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function DependencyDeleteAction({
  record,
  compact,
  onDeleted,
}: DependencyDeleteActionProps) {
  const { connections } = useRepositories();
  const remove = useDeleteDependency();
  return (
    <Can privilege="connections:delete">
      <DeleteAction
        entityLabel="bağımlılık"
        entityName={'bu bağımlılık'}
        impactKey={['dependency', record.id]}
        loadImpact={() => connections.dependencies.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
