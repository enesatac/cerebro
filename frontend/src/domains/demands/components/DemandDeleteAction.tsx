import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteDemand } from '../api/mutations';
import type { Demand } from '../types';

interface DemandDeleteActionProps {
  record: Demand;
  compact?: boolean;
  onDeleted?: () => void;
}

/** Only the portfolio office deletes demands (e.g. duplicates); requesters withdraw instead. */
export function DemandDeleteAction({ record, compact, onDeleted }: DemandDeleteActionProps) {
  const { demands } = useRepositories();
  const remove = useDeleteDemand();
  return (
    <Can privilege="demandManagement:delete">
      <DeleteAction
        entityLabel="talep"
        entityName={`${record.code} ${record.title}`}
        impactKey={['demand', record.id]}
        loadImpact={() => demands.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
