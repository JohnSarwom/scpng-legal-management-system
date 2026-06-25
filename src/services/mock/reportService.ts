import { db } from './db';
import { delay } from './delay';
import { canAccessConfidentialCase } from '@/lib/utils';
import type { ReportService } from '../types';

export const mockReportService: ReportService = {
  async summary(user) {
    await delay();
    const assignedOnly = ['Senior Legal Officer', 'Legal Officer', 'Executive Officer'].includes(user.role);
    const cases = db.cases
      .filter((item) => canAccessConfidentialCase(item, user))
      .filter((item) => !assignedOnly || item.responsibleOfficerId === user.id || item.grantedUserIds?.includes(user.id));
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

  async entityLegalExposure() {
    await delay();
    return db.entities
      .map((ent) => ({
        entityId: ent.entityId,
        entityName: ent.entityName,
        openCases: db.cases.filter(
          (c) => c.entityId === ent.entityId && !['Closed', 'Archived'].includes(c.status),
        ).length,
        documents: db.documents.filter((d) => d.entityId === ent.entityId).length,
      }))
      .filter((row) => row.openCases > 0 || row.documents > 0)
      .sort((a, b) => b.openCases - a.openCases);
  },

  async officerWorkload() {
    await delay();
    return db.users.map((user) => ({
      officerId: user.id,
      name: user.name,
      openCases: db.cases.filter(
        (c) => c.responsibleOfficerId === user.id && !['Closed', 'Archived'].includes(c.status),
      ).length,
      activities: db.activities.filter((a) => a.createdBy === user.name).length,
    }));
  },

  async outstandingCorrespondence() {
    await delay();
    const closed = db.correspondence.filter((c) => c.closedDate && c.date);
    const avgResponseDays =
      closed.length > 0
        ? Math.round(
            closed.reduce((sum, c) => {
              const diff =
                new Date(c.closedDate!).getTime() - new Date(c.date).getTime();
              return sum + diff / (1000 * 60 * 60 * 24);
            }, 0) / closed.length,
          )
        : 0;
    return {
      count: db.correspondence.filter((c) => c.status === 'Awaiting Response').length,
      avgResponseDays,
    };
  },
};
