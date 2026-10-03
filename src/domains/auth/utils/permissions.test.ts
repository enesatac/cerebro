import { describe, expect, it } from 'vitest';
import { roles } from '@/services/mock/data/roles';
import { PRIVILEGES } from '../types';
import {
  hasPrivilege,
  levelOn,
  normalizePrivileges,
  privilegesFor,
  privilegesOfRoles,
} from './permissions';

const role = (name: string) => {
  const found = roles.find((r) => r.name === name);
  if (!found) throw new Error(`No seed role ${name}`);
  return found;
};

describe('privileges', () => {
  it('lists every screen level in the catalogue, without levels a screen lacks', () => {
    expect(PRIVILEGES).toContain('projects:delete');
    expect(PRIVILEGES).toContain('dashboard:view');
    expect(PRIVILEGES).not.toContain('dashboard:edit');
    expect(PRIVILEGES).not.toContain('leaves:delete');
  });

  it('implies the lower levels (delete ⇒ edit ⇒ view)', () => {
    expect(privilegesFor('projects', 'delete')).toEqual([
      'projects:view',
      'projects:edit',
      'projects:delete',
    ]);
    expect(normalizePrivileges(['risks:edit', 'unknown:view', 'risks:edit'])).toEqual([
      'risks:view',
      'risks:edit',
    ]);
    expect(levelOn(['teams:view', 'teams:edit'], 'teams')).toBe('edit');
    expect(levelOn([], 'teams')).toBeNull();
  });

  it('gives a user the union of their roles', () => {
    const union = privilegesOfRoles([role('İş birimi kullanıcısı'), role('Çalışan')]);
    expect(union).toContain('demands:edit');
    expect(union).toContain('leaves:view');
    expect(union).not.toContain('projects:edit');
  });

  it('gives the system role everything and the auditor nothing to change', () => {
    expect(role('Sistem yöneticisi').privileges).toEqual(PRIVILEGES);
    expect(role('Denetçi (salt okunur)').privileges.every((p) => p.endsWith(':view'))).toBe(true);
  });

  it('denies everything to deactivated or missing users', () => {
    expect(hasPrivilege({ active: false, privileges: PRIVILEGES }, 'projects:view')).toBe(false);
    expect(hasPrivilege(null, 'projects:view')).toBe(false);
  });
});
