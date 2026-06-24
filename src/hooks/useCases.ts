import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { caseService } from '@/services';
import { useSession } from '@/context/useSession';
import { useNotifications } from '@/context/useNotifications';
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
  const { currentUser, users } = useSession();
  const { push } = useNotifications();
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
    createCase: useMutation({
      mutationFn: (input: CaseInput) => caseService.create(input, currentUser),
      onSuccess: (created, input) => {
        invalidateAll();
        // Notify Legal Manager and General Counsel when a new case is opened (if they didn't create it)
        const notifyRoles = ['Legal Manager', 'General Counsel'] as const;
        users
          .filter((u) => notifyRoles.includes(u.role as typeof notifyRoles[number]) && u.id !== currentUser.id)
          .forEach((u) =>
            push({
              recipientId: u.id,
              type: 'case_created',
              title: 'New case opened',
              body: `${created.caseNumber} "${created.caseTitle}" has been opened.`,
              entityType: 'case',
              entityId: created.id,
              linkTo: `/cases/${created.id}`,
            }),
          );
        // Notify the responsible officer if they didn't create it
        if (input.responsibleOfficerId && input.responsibleOfficerId !== currentUser.id) {
          push({
            recipientId: input.responsibleOfficerId,
            type: 'case_assigned',
            title: 'Case assigned to you',
            body: `${created.caseNumber} "${created.caseTitle}" has been assigned to you.`,
            entityType: 'case',
            entityId: created.id,
            linkTo: `/cases/${created.id}`,
          });
        }
      },
    }),

    updateCase: useMutation({
      mutationFn: ({ id, patch, reason }: { id: string; patch: Partial<CaseInput>; reason?: string }) =>
        caseService.update(id, patch, currentUser, reason),
      onSuccess: (updated, variables) => {
        invalidateCase(updated, variables);
        if (!updated) return;
        // Notify on status change — tell the responsible officer (if someone else changed it)
        if (variables.patch.status && updated.responsibleOfficerId !== currentUser.id) {
          push({
            recipientId: updated.responsibleOfficerId,
            type: 'case_status_changed',
            title: 'Case status updated',
            body: `${updated.caseNumber} "${updated.caseTitle}" moved to ${variables.patch.status}.`,
            entityType: 'case',
            entityId: updated.id,
            linkTo: `/cases/${updated.id}`,
          });
        }
        // Notify newly assigned officer when responsibleOfficerId changes
        if (variables.patch.responsibleOfficerId && variables.patch.responsibleOfficerId !== currentUser.id) {
          push({
            recipientId: variables.patch.responsibleOfficerId,
            type: 'case_assigned',
            title: 'Case assigned to you',
            body: `${updated.caseNumber} "${updated.caseTitle}" has been assigned to you.`,
            entityType: 'case',
            entityId: updated.id,
            linkTo: `/cases/${updated.id}`,
          });
        }
      },
    }),

    deleteCase: useMutation({ mutationFn: (id: string) => caseService.remove(id, currentUser), onSuccess: invalidateAll }),
  };
}
