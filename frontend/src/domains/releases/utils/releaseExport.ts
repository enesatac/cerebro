import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import type { EntityId } from '@/domains/shared/types';
import { sheet, type SheetSpec } from '@/lib/xlsxTypes';
import type { Release } from '../types';

export interface ReleaseExportNames {
  application: (id: EntityId) => string | undefined;
  project: (id: EntityId | null) => string | undefined;
  person: (id: EntityId | null) => string | undefined;
}

/** Releases as one sheet, the same from the calendar and from an application or project. */
export function releaseSheet(
  releases: readonly Release[],
  masterData: Pick<MasterDataIndex, 'label'>,
  names: ReleaseExportNames,
  { title, subtitle }: { title: string; subtitle?: string },
): SheetSpec {
  return sheet<Release>({
    name: 'Canlı geçişler',
    title,
    subtitle,
    rows: releases,
    columns: [
      { header: 'Geçiş no', value: (r) => r.releaseNumber },
      { header: 'Başlık', value: (r) => r.title, width: 40 },
      { header: 'Uygulama', value: (r) => names.application(r.applicationId) },
      { header: 'Proje', value: (r) => names.project(r.projectId) },
      { header: 'Tür', value: (r) => masterData.label('releaseTypes', r.type) },
      { header: 'Durum', value: (r) => masterData.label('releaseStatuses', r.status) },
      { header: 'Tarih', value: (r) => r.plannedDate, type: 'date' },
      { header: 'Başlangıç saati', value: (r) => r.startTime },
      { header: 'Bitiş saati', value: (r) => r.endTime },
      { header: 'Sürüm', value: (r) => r.version },
      { header: 'Sorumlu', value: (r) => names.person(r.ownerId) },
      { header: 'Hizmet kesintisi', value: (r) => r.serviceInterruption },
      { header: 'Geçiş detayları', value: (r) => r.description, width: 50 },
      { header: 'Geri alma planı', value: (r) => r.rollbackPlan, width: 40 },
      { header: 'Sonuç', value: (r) => r.outcomeNote, width: 40 },
    ],
  });
}
