import { StatusBadge } from '@/components/data-display/StatusBadge';
import { PRIVILEGE_GROUPS, PRIVILEGE_MODULES, type Privilege } from '../types';
import { levelOn } from '../utils/permissions';
import { ACCESS_LEVEL_PRESENTATION } from '../utils/rolePresentation';

/**
 * What a set of privileges allows, screen by screen — the effective access of a user (the union of
 * their roles) or of a role.
 */
export function AccessPreview({
  privileges,
  label = 'Etkin yetkiler',
}: {
  privileges: readonly Privilege[];
  label?: string;
}) {
  return (
    <div className="c-access-preview" role="group" aria-label={label}>
      {PRIVILEGE_GROUPS.map((group) => (
        <div key={group.id} className="c-access-preview__group">
          <p className="c-access-preview__heading">{group.label}</p>
          <dl className="c-access-preview__list">
            {PRIVILEGE_MODULES.filter((m) => m.group === group.id).map((module) => {
              const level = levelOn(privileges, module.id) ?? 'none';
              return (
                <div key={module.id} className="c-access-preview__item">
                  <dt>{module.label}</dt>
                  <dd>
                    {level === 'none' ? (
                      <span className="c-muted">{ACCESS_LEVEL_PRESENTATION.none.label}</span>
                    ) : (
                      <StatusBadge {...ACCESS_LEVEL_PRESENTATION[level]} />
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}
