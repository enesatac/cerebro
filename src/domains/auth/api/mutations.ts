import { useQueryClient } from '@tanstack/react-query';
import { useRepositoryMutation } from '@/hooks/useRepositoryMutation';
import { useRepositories } from '@/services/RepositoryContext';
import type { UserAccountInput } from '../types';
import { authKeys } from './queries';

export function useSaveUser(id?: string) {
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
        id ? `${user.displayName} updated` : `${user.displayName} can now sign in`,
    },
  );
}
