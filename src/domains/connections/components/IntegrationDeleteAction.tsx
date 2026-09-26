import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteIntegration } from '../api/mutations';
import type { Integration } from '../types';

interface IntegrationDeleteActionProps {
  record: Integration;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function IntegrationDeleteAction({
  record,
  compact,
  onDeleted,
}: IntegrationDeleteActionProps) {
  const { connections } = useRepositories();
  const remove = useDeleteIntegration();
  return (
    <Can permission="portfolio:delete">
      <DeleteAction
        entityLabel="entegrasyon"
        entityName={record.name}
        impactKey={['integration', record.id]}
        loadImpact={() => connections.integrations.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
