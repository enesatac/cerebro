import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import type { Release } from '../types';

export function ReleaseTitleCell({ release }: { release: Release }) {
  return (
    <span className="c-cell-stack">
      <EntityLink to={paths.releases.detail(release.id)}>{release.title}</EntityLink>
      <span className="c-muted c-cell-stack__secondary">
        {release.releaseNumber}
        {release.version && ` · v${release.version}`}
      </span>
    </span>
  );
}
