import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteRisk } from '../api/mutations';
import type { Risk } from '../types';

interface RiskDeleteActionProps {
  record: Risk;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function RiskDeleteAction({ record, compact, onDeleted }: RiskDeleteActionProps) {
  const { risks } = useRepositories();
  const remove = useDeleteRisk();
  return (
    <Can privilege="risks:delete">
      <DeleteAction
        entityLabel="risk"
        entityName={record.title}
        impactKey={['risk', record.id]}
        loadImpact={() => risks.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
