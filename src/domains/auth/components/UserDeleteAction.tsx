import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from './Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteUser } from '../api/mutations';
import type { UserAccount } from '../types';

interface UserDeleteActionProps {
  record: UserAccount;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function UserDeleteAction({ record, compact, onDeleted }: UserDeleteActionProps) {
  const { users } = useRepositories();
  const remove = useDeleteUser();
  return (
    <Can privilege="users:edit">
      <DeleteAction
        entityLabel="kullanıcı hesabı"
        entityName={record.displayName}
        impactKey={['user', record.id]}
        loadImpact={() => users.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
