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
          title="Son durum"
          description={`Mevcut aşama: ${PROJECT_PHASE_LABELS[project.currentPhase]}`}
        >
          <DetailList
            items={[
              { label: 'Özet', value: project.latestStatusSummary },
              { label: 'Sonraki adımlar', value: project.nextSteps },
            ]}
          />
        </SectionCard>
        <SectionCard title="Hakkında">
          <p className="c-prose">{project.description}</p>
          <DetailList
            items={[
              { label: 'Hedef', value: project.objective },
              { label: 'Kapsam', value: project.scope },
              { label: 'Kapsam dışı', value: project.outOfScope },
              { label: 'Proje türü', value: PROJECT_TYPE_LABELS[project.type] },
              { label: 'Gizlilik', value: CONFIDENTIALITY_LABELS[project.confidentiality] },
              {
                label: 'Etiketler',
                value: project.tags.length > 0 ? <TagList tags={project.tags} /> : null,
              },
            ]}
          />
        </SectionCard>
      </div>
      <div className="c-stack">
        <SectionCard title="Zaman çizelgesi">
          <DetailList
            items={[
              { label: 'Planlanan başlangıç', value: formatDate(timeline.plannedStartDate, '') },
              {
                label: 'Gerçekleşen başlangıç',
                value: formatDate(timeline.actualStartDate, ''),
                emptyText: 'Başlamadı',
              },
              { label: 'Planlanan bitiş', value: formatDate(timeline.plannedEndDate, '') },
              {
                label: 'Gerçekleşen bitiş',
                value: formatDate(timeline.actualEndDate, ''),
                emptyText: 'Bitmedi',
              },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Finansal bilgiler"
          description="Bütçe rakamları ileride yetkili rollerle sınırlandırılabilir."
        >
          {financials ? (
            <DetailList
              items={[
                {
                  label: 'Bütçe',
                  value: formatCurrency(financials.budget, financials.currency, ''),
                },
                {
                  label: 'Gerçekleşen maliyet',
                  value: formatCurrency(financials.actualCost, financials.currency, ''),
                },
                {
                  label: 'Tahmini maliyet',
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
            <p className="c-muted">Bu proje için finansal bilgi kaydedilmedi.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
