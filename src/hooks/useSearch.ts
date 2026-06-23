import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services';
import { useSession } from '@/context/useSession';

export function useSearch(query: string, kind: string) {
  const { currentUser } = useSession();
  return useQuery({ queryKey: ['search', query, kind, currentUser.id], queryFn: () => searchService.search(query, currentUser, kind), enabled: query.trim().length > 0 });
}
