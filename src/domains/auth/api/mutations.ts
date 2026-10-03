import { useQueryClient } from '@tanstack/react-query';
import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { RoleId, RoleInput, UserAccountInput } from '../types';
import { authKeys } from './queries';

export function useSaveUser(id?: EntityId) {
  const { users } = useRepositories();
  const queryClient = useQueryClient();
  return useRepositoryMutation(
    async (input: UserAccountInput) => {
      const saved = id ? await users.update(id, input) : await users.create(input);
      // Account, sign-in and session data live under the auth keys the generic invalidation skips.
      await queryClient.invalidateQueries({ queryKey: authKeys.signInAccounts });
      await queryClient.invalidateQueries({ queryKey: authKeys.session });
      return saved;
    },
    {
      successTitle: (user) =>
        id ? `${user.displayName} güncellendi` : `${user.displayName} artık giriş yapabilir`,
    },
  );
}

export function useDeleteUser() {
  const { users } = useRepositories();
  const queryClient = useQueryClient();
  return useRepositoryMutation(
    async (id: EntityId) => {
      await users.remove(id);
      await queryClient.invalidateQueries({ queryKey: authKeys.users });
      await queryClient.invalidateQueries({ queryKey: authKeys.signInAccounts });
    },
    { successTitle: () => 'Kullanıcı hesabı silindi' },
  );
}

/** Role changes alter what the signed-in user may do, so the session is refreshed too. */
export function useSaveRole(id?: RoleId) {
  const { roles } = useRepositories();
  const queryClient = useQueryClient();
  return useRepositoryMutation(
    async (input: RoleInput) => {
      const saved = id ? await roles.update(id, input) : await roles.create(input);
      await queryClient.invalidateQueries({ queryKey: authKeys.session });
      await queryClient.invalidateQueries({ queryKey: authKeys.signInAccounts });
      return saved;
    },
    { successTitle: (role) => (id ? `${role.name} güncellendi` : `${role.name} rolü oluşturuldu`) },
  );
}

export function useDeleteRole() {
  const { roles } = useRepositories();
  return useRepositoryMutation((id: RoleId) => roles.remove(id), {
    successTitle: () => 'Rol silindi',
  });
}
