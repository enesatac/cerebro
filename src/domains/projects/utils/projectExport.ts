import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import { sheet, type SheetSpec } from '@/lib/xlsxTypes';
import type { ProjectListItem } from '../types';

/** The project list as an Excel sheet — one definition for every place that lists projects. */
export function projectSheet(
  items: readonly ProjectListItem[],
  masterData: Pick<MasterDataIndex, 'label'>,
  { title, subtitle, name = 'Projeler' }: { title: string; subtitle?: string; name?: string },
): SheetSpec {
  return sheet<ProjectListItem>({
    name,
    title,
    subtitle,
    rows: items,
    columns: [
      { header: 'Kod', value: (p) => p.code },
      { header: 'Ad', value: (p) => p.name },
      { header: 'Durum', value: (p) => masterData.label('projectStatuses', p.status) },
      { header: 'Sağlık', value: (p) => masterData.label('projectHealths', p.health) },
      { header: 'Öncelik', value: (p) => masterData.label('criticalities', p.priority) },
      { header: 'Aşama', value: (p) => masterData.label('projectPhases', p.currentPhase) },
      { header: 'İlerleme', value: (p) => p.progressPercentage, type: 'percent' },
      { header: 'İş birimi', value: (p) => p.businessUnit?.name },
      { header: 'Proje yöneticisi', value: (p) => p.projectManager?.name },
      { header: 'Planlanan bitiş', value: (p) => p.plannedEndDate, type: 'date' },
    ],
  });
}
