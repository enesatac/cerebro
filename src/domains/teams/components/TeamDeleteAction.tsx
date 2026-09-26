import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteTeam } from '../api/mutations';
import type { Team } from '../types';

interface TeamDeleteActionProps {
  /** Only the id and display name are needed, so list rows can pass their read model. */
  record: Pick<Team, 'id' | 'name'>;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function TeamDeleteAction({ record, compact, onDeleted }: TeamDeleteActionProps) {
  const { teams } = useRepositories();
  const remove = useDeleteTeam();
  return (
    <Can permission="portfolio:delete">
      <DeleteAction
        entityLabel="ekip"
        entityName={record.name}
        impactKey={['team', record.id]}
        loadImpact={() => teams.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
