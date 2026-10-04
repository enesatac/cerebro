import { Link } from 'react-router';
import { paths } from '@/app/router/paths';
import { DetailList } from '@/components/data-display/DetailList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { formatDecimal } from '@/lib/format';
import type { Demand } from '../types';
import {
  EFFORT_CRITERION,
  priorityScore,
  suggestedPriority,
  VALUE_CRITERIA,
} from '../utils/demandScoring';
import { DemandPlan } from './DemandPlan';

/** The portfolio office's assessment as the requester sees it: scores, priority, plan, decision. */
export function DemandAssessmentSummary({ demand }: { demand: Demand }) {
  const people = usePeopleById();
  const projects = useProjectRefs();
  const { assessment } = demand;
  const score = priorityScore(assessment);
  const suggestion = suggestedPriority(score);
  const project = assessment.projectId !== null ? projects.data?.get(assessment.projectId) : null;
  const untouched =
    [...VALUE_CRITERIA, EFFORT_CRITERION].every((c) => assessment[c.key] === null) &&
    !assessment.priority &&
    !assessment.plannedStart &&
    !assessment.decisionNote;
  if (untouched) {
    return (
      <EmptyState
        compact
        title="Henüz değerlendirilmedi"
        description="Portföy ofisi talebi puanladığında öncelik ve takvim burada görünür."
      />
    );
  }
  return (
    <div className="c-stack c-stack--s">
      <div className="c-score-summary">
        <div className="c-score-summary__value">
          <span className="c-score-summary__label">Puan (WSJF)</span>
          <strong className="c-score-summary__number">{formatDecimal(score)}</strong>
        </div>
        <ul className="c-score-breakdown" aria-label="Puanlama ölçütleri">
          {[...VALUE_CRITERIA, EFFORT_CRITERION].map((criterion) => (
            <li key={criterion.key}>
              <span className="c-muted">{criterion.label}</span>{' '}
              <strong>{assessment[criterion.key] ?? '—'}</strong>
            </li>
          ))}
        </ul>
      </div>
      <DetailList
        items={[
          {
            label: 'Öncelik',
            value: assessment.priority ? (
              <MasterBadge list="demandPriorities" code={assessment.priority} />
            ) : null,
            emptyText: suggestion ? 'Belirlenmedi (puana göre önerilen var)' : 'Belirlenmedi',
          },
          {
            label: 'Değerlendiren',
            value:
              assessment.assessorId !== null
                ? people.data?.get(assessment.assessorId)?.fullName
                : null,
            emptyText: 'Atanmamış',
          },
          {
            label: 'Plan',
            value:
              assessment.plannedStart && assessment.plannedEnd ? (
                <DemandPlan demand={demand} />
              ) : null,
            emptyText: 'Takvime alınmadı',
          },
          ...(assessment.projectId !== null
            ? [
                {
                  label: 'Proje',
                  value: (
                    <Link className="c-link" to={paths.projects.detail(assessment.projectId)}>
                      {project?.name ?? 'Projeyi aç'}
                    </Link>
                  ),
                },
              ]
            : []),
          { label: 'Karar notu', value: assessment.decisionNote, emptyText: 'Not yok' },
        ]}
      />
    </div>
  );
}
