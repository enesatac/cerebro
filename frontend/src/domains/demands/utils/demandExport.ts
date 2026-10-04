import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import type { EntityId } from '@/domains/shared/types';
import type { PortfolioNames } from '@/domains/shared/utils/portfolioNames';
import { sheet, type SheetSpec } from '@/lib/xlsxTypes';
import type { Demand } from '../types';
import { priorityScore, suggestedPriority } from './demandScoring';

export interface DemandExportNames extends Pick<PortfolioNames, 'applications' | 'project'> {
  person: (id: EntityId | null) => string | undefined;
  unit: (id: EntityId) => string | undefined;
}

/**
 * Demands as one Excel sheet with the request, the assessment and the plan side by side — the
 * same columns wherever demands are exported, so files can be compared and merged.
 */
export function demandSheet(
  demands: readonly Demand[],
  masterData: Pick<MasterDataIndex, 'label'>,
  names: DemandExportNames,
  { title, subtitle, name = 'Talepler' }: { title: string; subtitle?: string; name?: string },
): SheetSpec {
  const code = (list: Parameters<MasterDataIndex['label']>[0], value: string | null) =>
    value ? masterData.label(list, value) : '';
  return sheet<Demand>({
    name,
    title,
    subtitle,
    rows: demands,
    columns: [
      { header: 'Kod', value: (d) => d.code },
      { header: 'Başlık', value: (d) => d.title, width: 40 },
      { header: 'Durum', value: (d) => code('demandStatuses', d.status) },
      { header: 'Tür', value: (d) => code('demandTypes', d.type) },
      { header: 'İş birimi', value: (d) => names.unit(d.businessUnitId) },
      { header: 'Talep eden', value: (d) => names.person(d.requesterId) },
      { header: 'Sponsor', value: (d) => names.person(d.sponsorId) },
      { header: 'Gönderim', value: (d) => d.submittedAt, type: 'date' },
      { header: 'Aciliyet', value: (d) => code('criticalities', d.urgency) },
      { header: 'Yasal zorunluluk', value: (d) => d.regulatory },
      { header: 'İstenen tarih', value: (d) => d.desiredDate, type: 'date' },
      { header: 'Tarih gerekçesi', value: (d) => d.deadlineReason, width: 30 },
      { header: 'Mevcut durum ve ihtiyaç', value: (d) => d.problem, width: 50 },
      { header: 'Beklenen çözüm', value: (d) => d.proposedSolution, width: 50 },
      { header: 'Beklenen fayda', value: (d) => d.expectedBenefits, width: 50 },
      {
        header: 'Fayda türleri',
        value: (d) =>
          d.benefitTypes.map((t) => masterData.label('demandBenefitTypes', t)).join('\n'),
      },
      { header: 'Etkilenen kullanıcı', value: (d) => d.affectedUsers, type: 'integer' },
      { header: 'Tahmini bütçe', value: (d) => d.estimatedBudget, type: 'integer' },
      { header: 'Para birimi', value: (d) => (d.estimatedBudget === null ? '' : d.currency) },
      { header: 'İlgili uygulamalar', value: (d) => names.applications(d.relatedApplicationIds) },
      { header: 'İş değeri', value: (d) => d.assessment.businessValue, type: 'integer' },
      { header: 'Stratejik uyum', value: (d) => d.assessment.strategicFit, type: 'integer' },
      { header: 'Zaman kritikliği', value: (d) => d.assessment.timeCriticality, type: 'integer' },
      { header: 'Risk azaltma', value: (d) => d.assessment.riskReduction, type: 'integer' },
      { header: 'Efor', value: (d) => d.assessment.effort, type: 'integer' },
      { header: 'Puan (WSJF)', value: (d) => priorityScore(d.assessment), type: 'decimal' },
      {
        header: 'Önerilen öncelik',
        value: (d) => code('demandPriorities', suggestedPriority(priorityScore(d.assessment))),
      },
      { header: 'Öncelik', value: (d) => code('demandPriorities', d.assessment.priority) },
      { header: 'Değerlendiren', value: (d) => names.person(d.assessment.assessorId) },
      { header: 'Planlanan başlangıç', value: (d) => d.assessment.plannedStart, type: 'date' },
      { header: 'Planlanan bitiş', value: (d) => d.assessment.plannedEnd, type: 'date' },
      {
        header: 'Proje',
        value: (d) =>
          d.assessment.projectId === null ? '' : names.project(d.assessment.projectId),
      },
      { header: 'Karar notu', value: (d) => d.assessment.decisionNote, width: 50 },
    ],
  });
}
