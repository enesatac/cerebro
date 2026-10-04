import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import { PRIVILEGE_MODULES, type AccessLevel, type Privilege } from '../types';
import { levelOn } from './permissions';

/** How a module's access level reads in the matrix and the role editor. */
export const ACCESS_LEVEL_PRESENTATION: Record<
  AccessLevel | 'none',
  StatusPresentation & { short: string }
> = {
  none: { label: 'Erişim yok', short: '—', variant: 'neutral' },
  view: { label: 'Görüntüleme', short: 'Görüntüleme', variant: 'info' },
  edit: { label: 'Düzenleme', short: 'Düzenleme', variant: 'warning' },
  delete: { label: 'Tam yetki (silme dahil)', short: 'Tam yetki', variant: 'success' },
};

export const ACCOUNT_STATUS_PRESENTATION: Record<'active' | 'inactive', StatusPresentation> = {
  active: { label: 'Aktif', variant: 'success' },
  inactive: { label: 'Devre dışı', variant: 'neutral' },
};

/** "6 ekranda düzenleme, 9 ekranda görüntüleme" — a role's or a user's reach in one line. */
export function accessSummary(privileges: readonly Privilege[]): string {
  const levels = PRIVILEGE_MODULES.map((m) => levelOn(privileges, m.id));
  const changes = levels.filter((l) => l === 'edit' || l === 'delete').length;
  const readOnly = levels.filter((l) => l === 'view').length;
  if (changes + readOnly === 0) return 'Hiçbir ekrana erişimi yok';
  return [
    changes > 0 && `${changes} ekranda düzenleme`,
    readOnly > 0 && `${readOnly} ekranda yalnızca görüntüleme`,
  ]
    .filter(Boolean)
    .join(', ');
}
