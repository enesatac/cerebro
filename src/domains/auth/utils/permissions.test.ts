import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../types';
import { hasPermission, ROLE_PERMISSIONS } from './permissions';

describe('permissions', () => {
  it('gives admins every permission', () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission({ role: 'admin', active: true }, permission)).toBe(true);
    }
  });

  it('gives users view access and demand submission only', () => {
    expect(ROLE_PERMISSIONS.user).toEqual(['portfolio:view', 'demands:submit']);
    expect(hasPermission({ role: 'user', active: true }, 'demands:manage')).toBe(false);
    expect(hasPermission({ role: 'user', active: true }, 'portfolio:edit')).toBe(false);
    expect(hasPermission({ role: 'user', active: true }, 'users:manage')).toBe(false);
  });

  it('denies everything to deactivated or missing users', () => {
    expect(hasPermission({ role: 'admin', active: false }, 'portfolio:view')).toBe(false);
    expect(hasPermission(null, 'portfolio:view')).toBe(false);
  });
});
