import { NotFoundState } from '@/components/feedback/NotFoundState';
import { paths } from './paths';

export default function NotFoundPage() {
  return (
    <NotFoundState
      title="Sayfa bulunamadı"
      description="Adres yanlış yazılmış ya da sayfa taşınmış olabilir."
      backTo={paths.dashboard()}
      backLabel="Gösterge paneline git"
    />
  );
}
