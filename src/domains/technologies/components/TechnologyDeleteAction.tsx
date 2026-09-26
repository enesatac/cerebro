import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteTechnology } from '../api/mutations';
import type { Technology } from '../types';

interface TechnologyDeleteActionProps {
  /** Only the id and display name are needed, so list rows can pass their read model. */
  record: Pick<Technology, 'id' | 'name'>;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function TechnologyDeleteAction({
  record,
  compact,
  onDeleted,
}: TechnologyDeleteActionProps) {
  const { technologies } = useRepositories();
  const remove = useDeleteTechnology();
  return (
    <Can permission="portfolio:delete">
      <DeleteAction
        entityLabel="teknoloji"
        entityName={record.name}
        impactKey={['technology', record.id]}
        loadImpact={() => technologies.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
