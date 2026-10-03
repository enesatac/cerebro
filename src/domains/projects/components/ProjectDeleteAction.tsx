import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteProject } from '../api/mutations';
import type { Project } from '../types';

interface ProjectDeleteActionProps {
  /** Only the id and display name are needed, so list rows can pass their read model. */
  record: Pick<Project, 'id' | 'name'>;
  /** Small "Sil" button for table rows and headers. */
  compact?: boolean;
  onDeleted?: () => void;
}

/** Delete with an impact confirmation; rendered only for roles allowed to delete. */
export function ProjectDeleteAction({ record, compact, onDeleted }: ProjectDeleteActionProps) {
  const { projects } = useRepositories();
  const remove = useDeleteProject();
  return (
    <Can privilege="projects:delete">
      <DeleteAction
        entityLabel="proje"
        entityName={record.name}
        impactKey={['project', record.id]}
        loadImpact={() => projects.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        onDeleted={onDeleted}
        compact={compact}
      />
    </Can>
  );
}
