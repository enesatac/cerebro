import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, isValidationError } from '@/lib/errors';
import { toaster } from '@/lib/toaster';

interface RepositoryMutationOptions<TResult> {
  /** Toast title on success, e.g. `Application saved`. */
  successTitle: (result: TResult) => string;
  successDescription?: (result: TResult) => string;
}

/**
 * A write through a repository with consistent feedback:
 * - success → toast, then every cached query is invalidated (writes cascade across domains —
 *   deleting an application changes projects, risks, dashboards — so targeted invalidation would
 *   be fragile; only active queries actually refetch);
 * - validation errors are left to the caller (they belong inline next to the field);
 * - anything else → error toast.
 */
export function useRepositoryMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  { successTitle, successDescription }: RepositoryMutationOptions<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (result) => {
      toaster.success({ title: successTitle(result), description: successDescription?.(result) });
      await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    },
    onError: (error) => {
      if (!isValidationError(error)) {
        toaster.error({ title: 'Değişiklik kaydedilmedi', description: getErrorMessage(error) });
      }
    },
  });
}
