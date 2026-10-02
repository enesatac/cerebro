import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import { sheet, type SheetSpec } from '@/lib/xlsxTypes';
import type { ApplicationListItem } from '../types';

/** The application list as an Excel sheet — one definition for every place that lists applications. */
export function applicationSheet(
  items: readonly ApplicationListItem[],
  masterData: Pick<MasterDataIndex, 'label'>,
  { title, subtitle, name = 'Uygulamalar' }: { title: string; subtitle?: string; name?: string },
): SheetSpec {
  return sheet<ApplicationListItem>({
    name,
    title,
    subtitle,
    rows: items,
    columns: [
      { header: 'Kod', value: (a) => a.code },
      { header: 'Ad', value: (a) => a.name },
      { header: 'Açıklama', value: (a) => a.shortDescription, width: 50 },
      {
        header: 'Yaşam döngüsü',
        value: (a) => masterData.label('applicationLifecycles', a.lifecycle),
      },
      { header: 'Kritiklik', value: (a) => masterData.label('criticalities', a.criticality) },
      {
        header: 'Operasyonel durum',
        value: (a) => masterData.label('operationalStatuses', a.operationalStatus),
      },
      { header: 'İş birimi', value: (a) => a.businessUnit?.name },
      { header: 'Teknik sahip', value: (a) => a.technicalOwner?.name ?? 'Atanmamış' },
      {
        header: 'Ekipler',
        value: (a) =>
          a.teams
            .map((t) => `${t.name} (${masterData.label('teamResponsibilities', t.responsibility)})`)
            .join('\n'),
      },
      { header: 'Son güncelleme', value: (a) => a.updatedAt, type: 'date' },
    ],
  });
}
