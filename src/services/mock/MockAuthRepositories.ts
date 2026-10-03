import type {
  AuthRepository,
  RoleRepository,
  UserRepository,
} from '@/domains/auth/api/AuthRepository';
import type { Role, RoleInput, UserAccount, UserAccountInput } from '@/domains/auth/types';
import { normalizePrivileges } from '@/domains/auth/utils/permissions';
import type { DeletionImpact } from '@/domains/shared/types';
import { ValidationError } from '@/lib/errors';
import type { MockDatabase } from './database';
import { copy, delay, findOrThrow } from './query';
import type { MockAuthority } from './session';
import { removeRow, replaceRow, type WriteKit } from './writeKit';

export function createMockAuthRepositories(
  db: MockDatabase,
  authority: MockAuthority,
  kit: WriteKit,
  latencyMs: number,
) {
  const wait = () => delay(latencyMs);
  const systemRoleIds = () => new Set(db.roles.filter((r) => r.system).map((r) => r.id));
  const isSystemAdmin = (user: Pick<UserAccount, 'roleIds' | 'active'>) =>
    user.active && user.roleIds.some((id) => systemRoleIds().has(id));

  const auth: AuthRepository = {
    getSession: async () => (await wait(), copy(authority.currentUser())),
    listSignInAccounts: async () => (
      await wait(),
      copy(db.users.filter((user) => user.active).map((u) => authority.resolve(u)))
    ),
    getSingleSignOnUrl: async () => null,
    async signIn(accountId) {
      await wait();
      const user = db.users.find((candidate) => candidate.id === accountId);
      if (!user?.active) throw new ValidationError('Bu hesap giriş yapamaz.');
      user.lastSignInAt = new Date().toISOString();
      authority.store.set(user.id);
      return copy(authority.resolve(user));
    },
    async signOut() {
      await wait();
      authority.store.set(null);
    },
  };

  /** Guards that keep the system administrable: someone must always hold the system role. */
  function validate(input: UserAccountInput, current: UserAccount | null, actor: UserAccount) {
    kit.assertUnique(
      db.users,
      input.email,
      (u) => u.email,
      current?.id ?? null,
      `${input.email} adresiyle bir hesap zaten var.`,
      'email',
    );
    kit.assertRefs([input.personId], db.people, 'kişi', 'personId');
    kit.assertRefs(input.roleIds, db.roles, 'rol', 'roleIds');
    if (input.roleIds.length === 0) {
      throw new ValidationError('En az bir rol seçin.', 'roleIds');
    }
    if (current?.id === actor.id && !input.active) {
      throw new ValidationError('Kendi hesabınızı devre dışı bırakamazsınız.', 'active');
    }
    if (current?.id === actor.id && isSystemAdmin(current) && !isSystemAdmin(input)) {
      throw new ValidationError('Kendi sistem yöneticisi rolünüzü kaldıramazsınız.', 'roleIds');
    }
    const otherAdmins = db.users.filter((u) => u.id !== current?.id && isSystemAdmin(u)).length;
    if (current && isSystemAdmin(current) && !isSystemAdmin(input) && otherAdmins === 0) {
      throw new ValidationError('En az bir aktif sistem yöneticisi gereklidir.', 'roleIds');
    }
  }

  function userDeletionImpact(user: UserAccount, actor: UserAccount | null): DeletionImpact {
    const otherAdmins = db.users.filter((u) => u.id !== user.id && isSystemAdmin(u)).length;
    const blockedReason =
      user.id === actor?.id
        ? 'Kendi hesabınızı silemezsiniz.'
        : isSystemAdmin(user) && otherAdmins === 0
          ? 'En az bir aktif sistem yöneticisi gereklidir; sonuncusunun hesabı silinemez.'
          : null;
    return { references: [], blockedReason };
  }

  const clean = (input: UserAccountInput): UserAccountInput => ({
    ...copy(input),
    roleIds: [...new Set(input.roleIds)],
  });

  const users: UserRepository = {
    async list() {
      await kit.begin('users:view');
      return copy([...db.users].sort((a, b) => a.displayName.localeCompare(b.displayName, 'tr')));
    },
    async getById(id) {
      await kit.begin('users:view');
      return copy(findOrThrow(db.users, id, 'Kullanıcı'));
    },
    async create(input) {
      const actor = await kit.begin('users:edit');
      validate(input, null, actor);
      const user: UserAccount = {
        ...clean(input),
        id: kit.nextId('users'),
        lastSignInAt: null,
        audit: kit.newAudit(actor),
      };
      db.users.push(user);
      return copy(user);
    },
    async update(id, input) {
      const actor = await kit.begin('users:edit');
      const current = findOrThrow(db.users, id, 'Kullanıcı');
      validate(input, current, actor);
      return copy(
        replaceRow(db.users, {
          ...current,
          ...clean(input),
          audit: kit.touch(current.audit, actor),
        }),
      );
    },
    async remove(id) {
      const actor = await kit.begin('users:edit');
      const user = findOrThrow(db.users, id, 'Kullanıcı');
      const { blockedReason } = userDeletionImpact(user, actor);
      if (blockedReason) throw new ValidationError(blockedReason);
      removeRow(db.users, id);
    },
    async getDeletionImpact(id) {
      const actor = await kit.begin('users:view');
      return userDeletionImpact(findOrThrow(db.users, id, 'Kullanıcı'), actor);
    },
  };

  const withCount = (role: Role): Role => ({
    ...role,
    userCount: db.users.filter((u) => u.roleIds.includes(role.id)).length,
  });

  const validateRole = (input: RoleInput, excludeId: number | null) => {
    if (!input.name.trim()) throw new ValidationError('Rol adı zorunludur.', 'name');
    if (input.name.length > 80) {
      throw new ValidationError('Rol adı en fazla 80 karakter olabilir.', 'name');
    }
    if (input.description.length > 300) {
      throw new ValidationError('Açıklama en fazla 300 karakter olabilir.', 'description');
    }
    kit.assertUnique(
      db.roles,
      input.name,
      (r) => r.name,
      excludeId,
      `"${input.name.trim()}" adında bir rol zaten var.`,
      'name',
    );
  };

  const cleanRole = (input: RoleInput): RoleInput => ({
    name: input.name.trim(),
    description: input.description.trim(),
    // Unknown codes are dropped and implied levels added (delete ⇒ edit ⇒ view).
    privileges: normalizePrivileges(input.privileges),
  });

  function roleDeletionImpact(role: Role): DeletionImpact {
    const holders = db.users.filter((u) => u.roleIds.includes(role.id)).length;
    return {
      references: holders > 0 ? [{ label: 'kullanıcı', count: holders }] : [],
      blockedReason: role.system
        ? 'Sistem yöneticisi rolü silinemez.'
        : holders > 0
          ? 'Bu rol kullanıcılara atanmış. Önce kullanıcılardan kaldırın.'
          : null,
    };
  }

  const roles: RoleRepository = {
    async list() {
      await kit.beginAny(['roles:view', 'users:view']);
      return copy(db.roles.map(withCount));
    },
    async getById(id) {
      await kit.beginAny(['roles:view', 'users:view']);
      return copy(withCount(findOrThrow(db.roles, id, 'Rol')));
    },
    async create(input) {
      const actor = await kit.begin('roles:edit');
      validateRole(input, null);
      const role: Role = {
        ...cleanRole(input),
        id: kit.nextId('roles'),
        system: false,
        userCount: 0,
        audit: kit.newAudit(actor),
      };
      db.roles.push(role);
      return copy(role);
    },
    async update(id, input) {
      const actor = await kit.begin('roles:edit');
      const current = findOrThrow(db.roles, id, 'Rol');
      if (current.system) throw new ValidationError('Sistem yöneticisi rolü değiştirilemez.');
      validateRole(input, id);
      return copy(
        withCount(
          replaceRow(db.roles, {
            ...current,
            ...cleanRole(input),
            audit: kit.touch(current.audit, actor),
          }),
        ),
      );
    },
    async remove(id) {
      await kit.begin('roles:edit');
      const { blockedReason } = roleDeletionImpact(findOrThrow(db.roles, id, 'Rol'));
      if (blockedReason) throw new ValidationError(blockedReason);
      removeRow(db.roles, id);
    },
    async getDeletionImpact(id) {
      await kit.begin('roles:view');
      return roleDeletionImpact(findOrThrow(db.roles, id, 'Rol'));
    },
  };

  return { auth, users, roles };
}
