import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { correspondenceService } from '@/services';
import { useSession } from '@/context/useSession';
import type { CorrespondenceFilter, CorrespondenceInput } from '@/types';

export function useCorrespondence(filter?: CorrespondenceFilter) {
  return useQuery({ queryKey: ['correspondence', filter], queryFn: () => correspondenceService.getAll(filter) });
}

export function useCorrespondenceItem(id?: string) {
  return useQuery({ queryKey: ['correspondence-item', id], queryFn: () => (id ? correspondenceService.getById(id) : null), enabled: Boolean(id) });
}

export function useCorrespondenceMutations() {
  const { currentUser } = useSession();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['correspondence'] });
  return {
    createCorrespondence: useMutation({ mutationFn: (input: CorrespondenceInput) => correspondenceService.create(input, currentUser), onSuccess: invalidate }),
    approveCorrespondence: useMutation({ mutationFn: (id: string) => correspondenceService.approve(id, currentUser), onSuccess: invalidate }),
    updateCorrespondence: useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<CorrespondenceInput> }) => correspondenceService.update(id, patch, currentUser), onSuccess: invalidate }),
  };
}
