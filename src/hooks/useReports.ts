import { useQuery } from '@tanstack/react-query';
import { auditService, reportService } from '@/services';
import { useSession } from '@/context/useSession';

export function useSummary() {
  const { currentUser } = useSession();
  return useQuery({ queryKey: ['summary', currentUser.id], queryFn: () => reportService.summary(currentUser) });
}

export function useAudit() {
  return useQuery({ queryKey: ['audit'], queryFn: () => auditService.getAll() });
}

export function useEntityLegalExposure() {
  return useQuery({ queryKey: ['entityLegalExposure'], queryFn: () => reportService.entityLegalExposure() });
}

export function useOfficerWorkload() {
  return useQuery({ queryKey: ['officerWorkload'], queryFn: () => reportService.officerWorkload() });
}

export function useOutstandingCorrespondence() {
  return useQuery({ queryKey: ['outstandingCorrespondence'], queryFn: () => reportService.outstandingCorrespondence() });
}
