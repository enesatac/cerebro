import { NotFoundState } from '@/components/feedback/NotFoundState';
import { paths } from './paths';

export default function NotFoundPage() {
  return (
    <NotFoundState
      title="Page not found"
      description="The address may be mistyped, or the page may have moved."
      backTo={paths.dashboard()}
      backLabel="Go to dashboard"
    />
  );
}
