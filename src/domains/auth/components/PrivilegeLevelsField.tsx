import { Button, Radio } from '@takeoff-ui/react-spar';
import { Controller, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { PRIVILEGE_GROUPS, PRIVILEGE_MODULES, type PrivilegeModule } from '../types';
import type { LevelChoice, RoleFormValues } from '../schemas/roleForm';
import { levelsOf } from '../utils/permissions';
import { ACCESS_LEVEL_PRESENTATION } from '../utils/rolePresentation';

interface PrivilegeLevelsFieldProps {
  control: Control<RoleFormValues>;
  setValue: UseFormSetValue<RoleFormValues>;
  disabled?: boolean;
}

const MODULE_BY_ID = new Map(PRIVILEGE_MODULES.map((m) => [m.id, m]));

/** What the chosen level allows on a screen, in the catalogue's words. */
function LevelHint({
  control,
  module,
}: {
  control: Control<RoleFormValues>;
  module: PrivilegeModule;
}) {
  const level = useWatch({ control, name: `levels.${module}` }) as LevelChoice | undefined;
  const definition = MODULE_BY_ID.get(module);
  if (!level || level === 'none' || !definition) {
    return <span className="c-muted">Ekran menüde görünmez ve açılamaz.</span>;
  }
  const levels = definition.levels as Partial<Record<LevelChoice, string>>;
  return <span>{levels[level]}</span>;
}

/**
 * The privilege matrix of one role: per screen, no access, read-only, edit or full (with delete),
 * as far as the screen supports. Higher levels include the lower ones.
 */
export function PrivilegeLevelsField({ control, setValue, disabled }: PrivilegeLevelsFieldProps) {
  const setAll = (level: 'none' | 'view') => {
    for (const module of PRIVILEGE_MODULES) {
      setValue(`levels.${module.id}`, level, { shouldDirty: true });
    }
  };
  return (
    <div className="c-stack c-stack--s">
      {!disabled && (
        <div className="c-quarter-shortcuts" role="group" aria-label="Toplu seçim">
          <Button
            size="small"
            variant="neutral"
            appearance="outlined"
            onClick={() => setAll('view')}
          >
            Tümünü salt okunur yap
          </Button>
          <Button
            size="small"
            variant="neutral"
            appearance="outlined"
            onClick={() => setAll('none')}
          >
            Tümünü kaldır
          </Button>
        </div>
      )}
      <table className="c-privilege-table">
        <caption className="c-visually-hidden">Ekran yetkileri</caption>
        <thead>
          <tr>
            <th scope="col">Ekran</th>
            <th scope="col">Erişim</th>
            <th scope="col">Bu seviyede</th>
          </tr>
        </thead>
        {PRIVILEGE_GROUPS.map((group) => (
          <tbody key={group.id}>
            <tr className="c-privilege-table__group">
              <th scope="colgroup" colSpan={3}>
                {group.label}
              </th>
            </tr>
            {PRIVILEGE_MODULES.filter((m) => m.group === group.id).map((module) => (
              <tr key={module.id}>
                <th scope="row">{module.label}</th>
                <td>
                  <Controller
                    control={control}
                    name={`levels.${module.id}`}
                    render={({ field }) => (
                      <Radio
                        aria-label={`${module.label} erişimi`}
                        orientation="horizontal"
                        size="small"
                        name={field.name}
                        value={String(field.value ?? 'none')}
                        onChange={field.onChange}
                        disabled={disabled}
                        className="c-privilege-table__levels"
                      >
                        {(['none', ...levelsOf(module.id)] as LevelChoice[]).map((level) => (
                          <Radio.Item key={level} value={level}>
                            <Radio.Indicator />
                            <Radio.Label>
                              {level === 'none' ? 'Yok' : ACCESS_LEVEL_PRESENTATION[level].short}
                            </Radio.Label>
                          </Radio.Item>
                        ))}
                      </Radio>
                    )}
                  />
                </td>
                <td className="c-privilege-table__hint">
                  <LevelHint control={control} module={module.id} />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
