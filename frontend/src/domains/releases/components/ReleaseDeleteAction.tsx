import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteRelease } from '../api/mutations';
import type { Release } from '../types';

interface ReleaseDeleteActionProps {
  record: Release;
  compact?: boolean;
  onDeleted?: () => void;
}

export function ReleaseDeleteAction({ record, compact, onDeleted }: ReleaseDeleteActionProps) {
  const { releases } = useRepositories();
  const remove = useDeleteRelease();
  return (
    <Can privilege="releases:delete">
      <DeleteAction
        entityLabel="canlı geçiş"
        entityName={`${record.releaseNumber} ${record.title}`}
        impactKey={['release', record.id]}
        loadImpact={() => releases.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
