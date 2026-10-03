import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteLeave } from '../api/mutations';
import type { LeaveRecord } from '../types';

interface LeaveDeleteActionProps {
  record: LeaveRecord;
  personName: string;
  compact?: boolean;
  onDeleted?: () => void;
}

export function LeaveDeleteAction({
  record,
  personName,
  compact,
  onDeleted,
}: LeaveDeleteActionProps) {
  const { leaves } = useRepositories();
  const remove = useDeleteLeave();
  return (
    <Can privilege="leaves:edit">
      <DeleteAction
        entityLabel="izin"
        entityName={`${personName} izni`}
        impactKey={['leave', record.id]}
        loadImpact={() => leaves.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
