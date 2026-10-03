import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/services/RepositoryContext';
import type { Privilege, RoleId, UserAccountId } from '../types';
import { hasPrivilege } from '../utils/permissions';

export const authKeys = {
  session: ['auth', 'session'] as const,
  signInAccounts: ['auth', 'sign-in-accounts'] as const,
  users: ['users'] as const,
  user: (id: UserAccountId) => ['users', id] as const,
  roles: ['roles'] as const,
  role: (id: RoleId) => ['roles', id] as const,
};

export function useSession() {
  const { auth } = useRepositories();
  return useQuery({
    queryKey: authKeys.session,
    queryFn: () => auth.getSession(),
    staleTime: Infinity,
  });
}

/** The signed-in account with its privileges (undefined while loading, null when signed out). */
export function useCurrentUser() {
  return useSession().data;
}

/** UI affordance only — the repository (backend) enforces the same rule on every write. */
export function usePrivilege(privilege: Privilege): boolean {
  return hasPrivilege(useCurrentUser(), privilege);
}

export function useSignInAccounts() {
  const { auth } = useRepositories();
  return useQuery({ queryKey: authKeys.signInAccounts, queryFn: () => auth.listSignInAccounts() });
}

/** Signing in or out drops every cached query so no data from the previous session leaks. */
export function useSignIn() {
  const { auth } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: UserAccountId) => auth.signIn(accountId),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.session, user);
    },
  });
}

export function useSignOut() {
  const { auth } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => auth.signOut(),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.session, null);
    },
  });
}

export function useUserAccounts() {
  const { users } = useRepositories();
  return useQuery({ queryKey: authKeys.users, queryFn: () => users.list() });
}

export function useUserAccount(id: UserAccountId) {
  const { users } = useRepositories();
  return useQuery({ queryKey: authKeys.user(id), queryFn: () => users.getById(id) });
}

export function useRoles() {
  const { roles } = useRepositories();
  return useQuery({ queryKey: authKeys.roles, queryFn: () => roles.list() });
}

export function useRole(id: RoleId) {
  const { roles } = useRepositories();
  return useQuery({ queryKey: authKeys.role(id), queryFn: () => roles.getById(id) });
}
