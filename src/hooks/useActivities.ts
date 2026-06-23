import { useQuery } from '@tanstack/react-query';
import { activityService } from '@/services';

export function useActivities(caseId?: string) {
  return useQuery({
    queryKey: ['activities', caseId],
    queryFn: () => (caseId ? activityService.getByCase(caseId) : []),
    enabled: Boolean(caseId),
  });
}
