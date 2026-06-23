import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { noteService } from '@/services';
import { useSession } from '@/context/useSession';

export function useNotes(caseId?: string) {
  return useQuery({ queryKey: ['notes', caseId], queryFn: () => (caseId ? noteService.getByCase(caseId) : []), enabled: Boolean(caseId) });
}

export function useCreateNote(caseId: string) {
  const { currentUser } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => noteService.create(caseId, body, currentUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', caseId] });
      queryClient.invalidateQueries({ queryKey: ['activities', caseId] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
