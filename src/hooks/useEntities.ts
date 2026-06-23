import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { entityService } from '@/services';
import { useSession } from '@/context/useSession';
import type { EntityFilter, EntityImportRow, EntityInput } from '@/types';

export function useEntities(filter?: EntityFilter) {
  return useQuery({ queryKey: ['entities', filter], queryFn: () => entityService.getAll(filter) });
}

export function useEntity(id?: string | null) {
  return useQuery({ queryKey: ['entity', id], queryFn: () => (id ? entityService.getById(id) : null), enabled: Boolean(id) });
}

export function useEntityMutations() {
  const { currentUser } = useSession();
  const queryClient = useQueryClient();
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['entities'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['audit'] });
    queryClient.invalidateQueries({ queryKey: ['search'] });
  };
  const invalidateEntity = (_data: unknown, variables: { id: string }) => {
    invalidateAll();
    if (variables?.id) queryClient.invalidateQueries({ queryKey: ['entity', variables.id] });
  };
  return {
    createEntity: useMutation({ mutationFn: (input: EntityInput) => entityService.create(input, currentUser), onSuccess: invalidateAll }),
    updateEntity: useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<EntityInput> }) => entityService.update(id, patch, currentUser), onSuccess: invalidateEntity }),
    importEntities: useMutation({ mutationFn: (rows: EntityImportRow[]) => entityService.importMany(rows, currentUser), onSuccess: invalidateAll }),
  };
}
