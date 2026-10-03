import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteEscalation } from '../api/mutations';
import type { Escalation } from '../types';

interface EscalationDeleteActionProps {
  record: Escalation;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function EscalationDeleteAction({
  record,
  compact,
  onDeleted,
}: EscalationDeleteActionProps) {
  const { escalations } = useRepositories();
  const remove = useDeleteEscalation();
  return (
    <Can privilege="risks:delete">
      <DeleteAction
        entityLabel="eskalasyon"
        entityName={record.title}
        impactKey={['escalation', record.id]}
        loadImpact={() => escalations.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
