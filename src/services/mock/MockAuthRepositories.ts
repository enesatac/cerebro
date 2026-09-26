import type { AuthRepository, UserRepository } from '@/domains/auth/api/AuthRepository';
import type { UserAccount, UserAccountInput } from '@/domains/auth/types';
import { ValidationError } from '@/lib/errors';
import type { MockDatabase } from './database';
import { copy, delay, findOrThrow } from './query';
import type { MockAuthority } from './session';
import { replaceRow, type WriteKit } from './writeKit';

export function createMockAuthRepositories(
  db: MockDatabase,
  authority: MockAuthority,
  kit: WriteKit,
  latencyMs: number,
) {
  const wait = () => delay(latencyMs);

  const auth: AuthRepository = {
    getSession: async () => (await wait(), copy(authority.currentUser())),
    listSignInAccounts: async () => (await wait(), copy(db.users.filter((user) => user.active))),
    async signIn(accountId) {
      await wait();
      const user = db.users.find((candidate) => candidate.id === accountId);
      if (!user?.active) throw new ValidationError('Bu hesap giriş yapamaz.');
      user.lastSignInAt = new Date().toISOString();
      authority.store.set(user.id);
      return copy(user);
    },
    async signOut() {
      await wait();
      authority.store.set(null);
    },
  };

  /** Guards that keep the system administrable: someone must always be able to manage users. */
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
    if (current?.id === actor.id && !input.active) {
      throw new ValidationError('Kendi hesabınızı devre dışı bırakamazsınız.', 'active');
    }
    if (current?.id === actor.id && input.role !== 'admin') {
      throw new ValidationError('Kendi yönetici rolünüzü kaldıramazsınız.', 'role');
    }
    const losesAdmin =
      current?.role === 'admin' && current.active && (input.role !== 'admin' || !input.active);
    const otherAdmins = db.users.filter(
      (u) => u.role === 'admin' && u.active && u.id !== current?.id,
    ).length;
    if (losesAdmin && otherAdmins === 0) {
      throw new ValidationError('En az bir aktif yönetici gereklidir.', 'role');
    }
  }

  const users: UserRepository = {
    async list() {
      await kit.begin('users:manage');
      return copy([...db.users].sort((a, b) => a.displayName.localeCompare(b.displayName)));
    },
    async getById(id) {
      await kit.begin('users:manage');
      return copy(findOrThrow(db.users, id, 'Kullanıcı'));
    },
    async create(input) {
      const actor = await kit.begin('users:manage');
      validate(input, null, actor);
      const user: UserAccount = {
        ...copy(input),
        id: kit.uniqueId('user', input.displayName, db.users),
        lastSignInAt: null,
        audit: kit.newAudit(actor),
      };
      db.users.push(user);
      return copy(user);
    },
    async update(id, input) {
      const actor = await kit.begin('users:manage');
      const current = findOrThrow(db.users, id, 'Kullanıcı');
      validate(input, current, actor);
      return copy(
        replaceRow(db.users, {
          ...current,
          ...copy(input),
          audit: kit.touch(current.audit, actor),
        }),
      );
    },
  };

  return { auth, users };
}
