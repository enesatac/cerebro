import { paths } from '@/app/router/paths';
import type { AttentionItem, AttentionKind, AttentionSubjectKind } from '../types';

export const ATTENTION_KIND_LABELS: Record<AttentionKind, string> = {
  'missing-technical-owner': 'Ownership gap',
  'review-overdue': 'Review overdue',
  'retired-technology': 'Retired technology',
  'critical-risk': 'Risk',
  'active-escalation': 'Escalation',
  'overdue-milestone': 'Overdue milestone',
  'project-health': 'Project health',
};

export const ATTENTION_SUBJECT_LABELS: Record<AttentionSubjectKind, string> = {
  application: 'Application',
  project: 'Project',
  risk: 'Risk',
  escalation: 'Escalation',
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
