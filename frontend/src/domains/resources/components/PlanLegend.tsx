import type { EntityId, EntityRef } from '@/domains/shared/types';

interface PlanLegendProps {
  /** Projects with a bar in the current view. */
  projects: readonly EntityRef[];
  colorOf: (projectId: EntityId) => number;
}

/** Colour key: projects shown, then the load strip bands, leave and today. */
export function PlanLegend({ projects, colorOf }: PlanLegendProps) {
  return (
    <div className="c-stack c-stack--s">
      {projects.length > 0 && (
        <ul className="c-leave-legend" aria-label="Projeler">
          {projects.map((project) => (
            <li key={project.id}>
              <span
                className={`c-plan-legend__swatch c-plan__bar--c${colorOf(project.id)}`}
                aria-hidden="true"
              />
              {project.name}
            </li>
          ))}
        </ul>
      )}
      <ul className="c-leave-legend" aria-label="Yük ve işaretler">
        <li>
          <span className="c-plan-legend__strip c-plan__load-strip--partial" aria-hidden="true" />
          Kapasitesi var (%100 altı)
        </li>
        <li>
          <span className="c-plan-legend__strip c-plan__load-strip--full" aria-hidden="true" />
          Tam dolu (%100)
        </li>
        <li>
          <span className="c-plan-legend__strip c-plan__load-strip--over" aria-hidden="true" />
          Aşırı yük (%100 üstü)
        </li>
        <li>
          <span className="c-plan-legend__swatch c-plan-legend__swatch--leave" aria-hidden="true" />
          İzinli
        </li>
        <li>
          <span
            className="c-leave-legend__swatch c-leave-legend__swatch--today"
            aria-hidden="true"
          />
          Bugün
        </li>
      </ul>
    </div>
  );
}
