import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import type { EntityId, IsoDate } from '@/domains/shared/types';
import { sheet, type SheetSpec } from '@/lib/xlsxTypes';
import type { ProcurementStep, ProcurementSummary } from '../types';
import {
  currentStep,
  delayDays,
  PROCESS_STATE_LABELS,
  processState,
  progress,
} from './processState';

export interface ProcurementExportNames {
  project: (id: EntityId) => string | undefined;
  businessUnit: (id: EntityId | null) => string | undefined;
  person: (id: EntityId | null) => string | undefined;
}

/** Purchases and their steps as two sheets. */
export function procurementSheets(
  purchases: readonly ProcurementSummary[],
  today: IsoDate,
  masterData: Pick<MasterDataIndex, 'label'>,
  names: ProcurementExportNames,
  { title, subtitle }: { title: string; subtitle?: string },
): SheetSpec[] {
  const steps = purchases.flatMap((purchase) =>
    purchase.steps.map((step, index) => ({ purchase, step, order: index + 1 })),
  );
  return [
    sheet<ProcurementSummary>({
      name: 'Satın almalar',
      title,
      subtitle,
      rows: purchases,
      columns: [
        { header: 'Kod', value: (p) => p.code },
        { header: 'Başlık', value: (p) => p.title, width: 40 },
        { header: 'Proje', value: (p) => names.project(p.projectId) },
        { header: 'İş birimi', value: (p) => names.businessUnit(p.businessUnitId) },
        { header: 'Tedarikçi', value: (p) => p.vendorName },
        { header: 'Sorumlu', value: (p) => names.person(p.ownerId) },
        {
          header: 'Süreç durumu',
          value: (p) => PROCESS_STATE_LABELS[processState(p.steps, today)],
        },
        {
          header: 'Güncel adım',
          value: (p) => {
            const step = currentStep(p.steps);
            return step ? masterData.label('procurementSteps', step.type) : null;
          },
        },
        { header: 'Hedef tarih', value: (p) => currentStep(p.steps)?.plannedEnd, type: 'date' },
        { header: 'Tamamlanan adım', value: (p) => progress(p.steps).closed, type: 'integer' },
        { header: 'Toplam adım', value: (p) => progress(p.steps).total, type: 'integer' },
      ],
    }),
    sheet<{ purchase: ProcurementSummary; step: ProcurementStep; order: number }>({
      name: 'Adımlar',
      title: `${title} — adımlar`,
      subtitle,
      rows: steps,
      columns: [
        { header: 'Kod', value: (r) => r.purchase.code },
        { header: 'Satın alma', value: (r) => r.purchase.title, width: 36 },
        { header: 'Sıra', value: (r) => r.order, type: 'integer' },
        { header: 'Adım', value: (r) => masterData.label('procurementSteps', r.step.type) },
        {
          header: 'Durum',
          value: (r) => masterData.label('procurementStepStatuses', r.step.status),
        },
        { header: 'Sorumlu', value: (r) => names.person(r.step.ownerId) },
        { header: 'Planlanan başlangıç', value: (r) => r.step.plannedStart, type: 'date' },
        { header: 'Planlanan bitiş', value: (r) => r.step.plannedEnd, type: 'date' },
        { header: 'Gerçekleşen başlangıç', value: (r) => r.step.actualStart, type: 'date' },
        { header: 'Gerçekleşen bitiş', value: (r) => r.step.actualEnd, type: 'date' },
        { header: 'Sapma (gün)', value: (r) => delayDays(r.step, today), type: 'integer' },
        { header: 'Açıklama', value: (r) => r.step.note, width: 50 },
      ],
    }),
  ];
}
