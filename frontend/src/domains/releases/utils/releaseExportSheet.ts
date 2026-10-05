import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import type { EntityId } from '@/domains/shared/types';
import type { SheetSpec } from '@/lib/xlsxTypes';
import type { Release } from '../types';
import { releaseSheet } from './releaseExport';

/** `releaseSheet` with names looked up in the loaded reference maps. */
export function releaseExportSheet(
  releases: readonly Release[],
  masterData: Pick<MasterDataIndex, 'label'>,
  refs: {
    applications?: ReadonlyMap<EntityId, { name: string }>;
    projects?: ReadonlyMap<EntityId, { name: string }>;
    people?: ReadonlyMap<EntityId, { fullName: string }>;
    title: string;
    subtitle?: string;
  },
): SheetSpec {
  return releaseSheet(
    releases,
    masterData,
    {
      application: (id) => refs.applications?.get(id)?.name,
      project: (id) => (id === null ? undefined : refs.projects?.get(id)?.name),
      person: (id) => (id === null ? undefined : refs.people?.get(id)?.fullName),
    },
    { title: refs.title, subtitle: refs.subtitle },
  );
}
