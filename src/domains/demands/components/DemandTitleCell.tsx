import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import type { Demand } from '../types';

/** Title linking to the demand, with its code and (when set) the regulatory marker underneath. */
export function DemandTitleCell({ demand }: { demand: Demand }) {
  return (
    <span className="c-cell-stack">
      <EntityLink to={paths.demands.detail(demand.id)}>{demand.title}</EntityLink>
      <span className="c-muted c-cell-stack__secondary">
        {demand.code}
        {demand.regulatory && ' · Yasal zorunluluk'}
      </span>
    </span>
  );
}
