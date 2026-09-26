import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteDecision } from '../api/mutations';
import type { Decision } from '../types';

interface DecisionDeleteActionProps {
  record: Decision;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function DecisionDeleteAction({ record, compact, onDeleted }: DecisionDeleteActionProps) {
  const { decisions } = useRepositories();
  const remove = useDeleteDecision();
  return (
    <Can permission="portfolio:delete">
      <DeleteAction
        entityLabel="karar"
        entityName={record.title}
        impactKey={['decision', record.id]}
        loadImpact={() => decisions.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
