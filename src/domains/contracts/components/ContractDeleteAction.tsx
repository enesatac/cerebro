import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteContract } from '../api/mutations';
import type { Contract } from '../types';

interface ContractDeleteActionProps {
  record: Contract;
  compact?: boolean;
  onDeleted?: () => void;
}

export function ContractDeleteAction({ record, compact, onDeleted }: ContractDeleteActionProps) {
  const { contracts } = useRepositories();
  const remove = useDeleteContract();
  return (
    <Can privilege="contracts:delete">
      <DeleteAction
        entityLabel="sözleşme"
        entityName={`${record.code} ${record.title}`}
        impactKey={['contract', record.id]}
        loadImpact={() => contracts.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
