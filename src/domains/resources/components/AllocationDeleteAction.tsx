import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteAllocation } from '../api/mutations';
import type { Allocation } from '../types';

interface AllocationDeleteActionProps {
  record: Allocation;
  /** "Zeynep Çelik — Ödeme Altyapısı" */
  description: string;
  compact?: boolean;
}

export function AllocationDeleteAction({
  record,
  description,
  compact,
}: AllocationDeleteActionProps) {
  const { allocations } = useRepositories();
  const remove = useDeleteAllocation();
  return (
    <Can permission="resources:manage">
      <DeleteAction
        entityLabel="atama"
        entityName={`${description} ataması`}
        impactKey={['allocation', record.id]}
        loadImpact={() => allocations.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        compact={compact}
      />
    </Can>
  );
}
