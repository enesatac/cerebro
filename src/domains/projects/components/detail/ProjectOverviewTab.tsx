import { DetailList } from '@/components/data-display/DetailList';
import { TagList } from '@/components/data-display/TagList';
import { SectionCard } from '@/components/layout/SectionCard';
import { formatDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import type { Project } from '../../types';
import {
  CONFIDENTIALITY_LABELS,
  PROJECT_PHASE_LABELS,
  PROJECT_TYPE_LABELS,
} from '../../utils/projectPresentation';

export function ProjectOverviewTab({ project }: { project: Project }) {
  const { timeline, financials } = project;
  return (
    <div className="c-two-column">
      <div className="c-stack">
        <SectionCard
          title="Latest status"
          description={`Current phase: ${PROJECT_PHASE_LABELS[project.currentPhase]}`}
        >
          <DetailList
            items={[
              { label: 'Summary', value: project.latestStatusSummary },
              { label: 'Next steps', value: project.nextSteps },
            ]}
          />
        </SectionCard>
        <SectionCard title="About">
          <p className="c-prose">{project.description}</p>
          <DetailList
            items={[
              { label: 'Objective', value: project.objective },
              { label: 'Scope', value: project.scope },
              { label: 'Out of scope', value: project.outOfScope },
              { label: 'Project type', value: PROJECT_TYPE_LABELS[project.type] },
              { label: 'Confidentiality', value: CONFIDENTIALITY_LABELS[project.confidentiality] },
              {
                label: 'Tags',
                value: project.tags.length > 0 ? <TagList tags={project.tags} /> : null,
              },
            ]}
          />
        </SectionCard>
      </div>
      <div className="c-stack">
        <SectionCard title="Timeline">
          <DetailList
            items={[
              { label: 'Planned start', value: formatDate(timeline.plannedStartDate, '') },
              {
                label: 'Actual start',
                value: formatDate(timeline.actualStartDate, ''),
                emptyText: 'Not started',
              },
              { label: 'Planned end', value: formatDate(timeline.plannedEndDate, '') },
              {
                label: 'Actual end',
                value: formatDate(timeline.actualEndDate, ''),
                emptyText: 'Not finished',
              },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Financials"
          description="Budget figures may be restricted to authorised roles in future."
        >
          {financials ? (
            <DetailList
              items={[
                {
                  label: 'Budget',
                  value: formatCurrency(financials.budget, financials.currency, ''),
                },
                {
                  label: 'Actual cost',
                  value: formatCurrency(financials.actualCost, financials.currency, ''),
                },
                {
                  label: 'Forecast cost',
                  value: (
                    <span
                      className={
                        financials.budget !== null &&
                        financials.forecastCost !== null &&
                        financials.forecastCost > financials.budget
                          ? 'c-text-warning'
                          : undefined
                      }
                    >
                      {formatCurrency(financials.forecastCost, financials.currency)}
                    </span>
                  ),
                },
              ]}
            />
          ) : (
            <p className="c-muted">No financial information has been recorded for this project.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
