import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentService } from '@/services';
import { useSession } from '@/context/useSession';
import type { DocumentFilter, DocumentInput, NewVersionInput } from '@/types';

export function useDocuments(filter?: DocumentFilter) {
  const { currentUser } = useSession();
  return useQuery({ queryKey: ['documents', filter, currentUser.id], queryFn: () => documentService.getAll(filter, currentUser) });
}

export function useDocument(id?: string) {
  const { currentUser } = useSession();
  return useQuery({ queryKey: ['document', id, currentUser.id], queryFn: () => (id ? documentService.getById(id, currentUser) : null), enabled: Boolean(id) });
}

export function useDocumentMutations() {
  const { currentUser } = useSession();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['documents'] });
  return {
    uploadDocument: useMutation({ mutationFn: (input: DocumentInput) => documentService.create(input, currentUser), onSuccess: invalidate }),
    addVersion: useMutation({ mutationFn: ({ id, version }: { id: string; version: NewVersionInput }) => documentService.addVersion(id, version, currentUser), onSuccess: invalidate }),
    updateDocument: useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<DocumentInput> }) => documentService.update(id, patch, currentUser), onSuccess: invalidate }),
    download: useMutation({ mutationFn: (id: string) => documentService.download(id, currentUser), onSuccess: invalidate }),
  };
}
