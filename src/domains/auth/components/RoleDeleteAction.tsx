import { DeleteAction } from '@/components/actions/DeleteAction';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteRole } from '../api/mutations';
import type { Role } from '../types';
import { Can } from './Can';

/** Deleting is refused for the system role and for roles still held by users. */
export function RoleDeleteAction({
  record,
  compact,
  onDeleted,
}: {
  record: Role;
  compact?: boolean;
  onDeleted?: () => void;
}) {
  const { roles } = useRepositories();
  const remove = useDeleteRole();
  if (record.system) return null;
  return (
    <Can privilege="roles:edit">
      <DeleteAction
        entityLabel="rol"
        entityName={record.name}
        impactKey={['role', record.id]}
        loadImpact={() => roles.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
