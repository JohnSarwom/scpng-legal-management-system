import { db } from './db';
import { delay } from './delay';
import { canAccessConfidentialCase } from '@/lib/utils';
import type { ReportService } from '../types';

export const mockReportService: ReportService = {
  async summary(user) {
    await delay();
    const assignedOnly = ['Senior Legal Officer', 'Legal Officer', 'Executive Officer'].includes(user.role);
    const cases = db.cases.filter((item) => canAccessConfidentialCase(item, user)).filter((item) => !assignedOnly || item.responsibleOfficerId === user.id || item.grantedUserIds?.includes(user.id));
    const open = cases.filter((item) => !['Closed', 'Archived'].includes(item.status));
    return {
      openCases: open.length,
      highRiskMatters: open.filter((item) => item.isConfidential || item.caseType === 'Litigation').length,
      courtMatters: cases.filter((item) => item.caseType === 'Litigation').length,
      correspondenceThisMonth: db.correspondence.filter((item) => item.date.startsWith('2026-06')).length,
      documents: db.documents.length,
      awaitingResponse: db.correspondence.filter((item) => item.status === 'Awaiting Response').length,
    };
  },
  async audit() {
    await delay();
    return [...db.audit].sort((a, b) => b.date.localeCompare(a.date));
  },
};
