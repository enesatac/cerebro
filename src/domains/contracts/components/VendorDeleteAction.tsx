import { DeleteAction } from '@/components/actions/DeleteAction';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteVendor } from '../api/mutations';
import type { Vendor } from '../types';

/** Vendors with contracts cannot be deleted; the confirmation explains why. */
export function VendorDeleteAction({ record }: { record: Vendor }) {
  const { vendors } = useRepositories();
  const remove = useDeleteVendor();
  return (
    <Can privilege="contracts:delete">
      <DeleteAction
        entityLabel="tedarikçi"
        entityName={record.name}
        impactKey={['vendor', record.id]}
        loadImpact={() => vendors.getDeletionImpact(record.id)}
        onDelete={() => remove.mutateAsync(record.id)}
        compact
      />
    </Can>
  );
}
