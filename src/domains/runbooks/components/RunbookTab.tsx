import { paths } from '@/app/router/paths';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import type { Application } from '@/domains/applications/types';
import { CreateAction } from '@/domains/auth/components/RecordActions';
import { useRunbook } from '../api/queries';
import { RunbookView } from './RunbookView';

/** "Sorun anında" tab: the runbook, or an invitation to write one. */
export function RunbookTab({ application }: { application: Application }) {
  const query = useRunbook(application.id);
  if (query.isPending) return <LoadingState label="Müdahale rehberi yükleniyor" rows={5} />;
  if (query.isError) {
    return <ErrorState title="Müdahale rehberi yüklenemedi" onRetry={() => void query.refetch()} />;
  }
  if (!query.data) {
    return (
      <EmptyState
        title={`${application.name} için müdahale rehberi yok`}
        description="Sorun anında ilk yapılacakları, kontrol edilecek adresleri, aranacak kişileri ve bilinen sorunların çözümlerini tek yerde toplayın."
        action={
          <CreateAction
            to={paths.applications.editRunbook(application.id)}
            label="Rehber oluştur"
          />
        }
      />
    );
  }
  return <RunbookView runbook={query.data} application={application} />;
}
