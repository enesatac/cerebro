import { useQueryClient } from '@tanstack/react-query';
import type { EntityId } from '@/domains/shared/types';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { UserAccountInput } from '../types';
import { authKeys } from './queries';

export function useSaveUser(id?: EntityId) {
  const { users } = useRepositories();
  const queryClient = useQueryClient();
  return useRepositoryMutation(
    async (input: UserAccountInput) => {
      const saved = id ? await users.update(id, input) : await users.create(input);
      // Account and sign-in lists live under the auth keys the generic invalidation skips.
      await queryClient.invalidateQueries({ queryKey: authKeys.signInAccounts });
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
