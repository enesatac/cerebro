import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteRunbook } from '../api/mutations';
import type { Runbook } from '../types';

interface RunbookDeleteActionProps {
  record: Runbook;
  applicationName: string;
  onDeleted?: () => void;
}

export function RunbookDeleteAction({
  record,
  applicationName,
  onDeleted,
}: RunbookDeleteActionProps) {
  const { runbooks } = useRepositories();
  const remove = useDeleteRunbook();
  return (
    <Can permission="portfolio:delete">
      <DeleteAction
        entityLabel="rehber"
        entityName={`${applicationName} müdahale rehberi`}
        impactKey={['runbook', record.id]}
        loadImpact={() => runbooks.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
      />
    </Can>
  );
}
