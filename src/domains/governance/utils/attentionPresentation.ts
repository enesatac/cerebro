import { paths } from '@/app/router/paths';
import type { AttentionItem, AttentionKind, AttentionSubjectKind } from '../types';

export const ATTENTION_KIND_LABELS: Record<AttentionKind, string> = {
  'missing-technical-owner': 'Sahiplik eksik',
  'review-overdue': 'Gözden geçirme gecikmiş',
  'retired-technology': 'Emekli teknoloji',
  'critical-risk': 'Risk',
  'active-escalation': 'Eskalasyon',
  'overdue-milestone': 'Gecikmiş kilometre taşı',
  'project-health': 'Proje sağlığı',
};

export const ATTENTION_SUBJECT_LABELS: Record<AttentionSubjectKind, string> = {
  application: 'Uygulama',
  project: 'Proje',
  risk: 'Risk',
  escalation: 'Eskalasyon',
};

export function attentionHref(item: AttentionItem): string {
  switch (item.subject.kind) {
    case 'application':
      return paths.applications.detail(item.subject.id);
    case 'project':
      return paths.projects.detail(item.subject.id);
    case 'risk':
      return paths.risks('risks');
    case 'escalation':
      return paths.risks('escalations');
  }
}
