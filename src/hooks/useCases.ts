import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { caseService } from '@/services';
import { useSession } from '@/context/useSession';
import type { CaseFilter, CaseInput } from '@/types';

export function useCases(filter?: CaseFilter) {
  const { currentUser } = useSession();
  return useQuery({ queryKey: ['cases', filter, currentUser.id], queryFn: () => caseService.getAll(filter, currentUser) });
}

export function useCase(id?: string) {
  const { currentUser } = useSession();
  return useQuery({ queryKey: ['case', id, currentUser.id], queryFn: () => (id ? caseService.getById(id, currentUser) : null), enabled: Boolean(id) });
}

export function useCaseMutations() {
  const { currentUser } = useSession();
  const queryClient = useQueryClient();
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['audit'] });
  };
  const invalidateCase = (_data: unknown, variables: { id: string }) => {
    invalidateAll();
    if (variables?.id) {
      queryClient.invalidateQueries({ queryKey: ['case', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['activities', variables.id] });
    }
  };
  return {
    createCase: useMutation({ mutationFn: (input: CaseInput) => caseService.create(input, currentUser), onSuccess: invalidateAll }),
    updateCase: useMutation({ mutationFn: ({ id, patch, reason }: { id: string; patch: Partial<CaseInput>; reason?: string }) => caseService.update(id, patch, currentUser, reason), onSuccess: invalidateCase }),
    deleteCase: useMutation({ mutationFn: (id: string) => caseService.remove(id, currentUser), onSuccess: invalidateAll }),
  };
}
