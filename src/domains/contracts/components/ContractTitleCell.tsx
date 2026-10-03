import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import type { Contract } from '../types';

export function ContractTitleCell({ contract }: { contract: Contract }) {
  return (
    <span className="c-cell-stack">
      <EntityLink to={paths.contracts.detail(contract.id)}>{contract.title}</EntityLink>
      <span className="c-muted c-cell-stack__secondary">
        {contract.code}
        {contract.purchaseOrderNumber && ` · ${contract.purchaseOrderNumber}`}
      </span>
    </span>
  );
}
