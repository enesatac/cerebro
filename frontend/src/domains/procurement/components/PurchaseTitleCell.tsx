import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import type { ProcurementSummary } from '../types';

export function PurchaseTitleCell({ purchase }: { purchase: ProcurementSummary }) {
  return (
    <span className="c-cell-stack">
      <EntityLink to={paths.procurement.detail(purchase.contractId)}>{purchase.title}</EntityLink>
      <span className="c-muted c-cell-stack__secondary">
        {purchase.code} · {purchase.vendorName}
      </span>
    </span>
  );
}
