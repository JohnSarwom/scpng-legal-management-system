import { nanoid } from 'nanoid';
import { db, nextNumber } from './db';
import { delay } from './delay';
import { mockAuditService } from './auditService';
import { canViewCase, caseAccess, now, today } from '@/lib/utils';
import type { CaseService } from '../types';
import type { Case } from '@/types';

function scopedRows(user?: Parameters<CaseService['getAll']>[1]) {
  let rows = [...db.cases];
  if (user) rows = rows.filter((item) => canViewCase(item, user));
  return rows;
}

export const mockCaseService: CaseService = {
  async getAll(filter = {}, user) {
    await delay();
    const query = filter.query?.toLowerCase().trim();
    const rows = scopedRows(user)
      .filter((item) => filter.includeArchived || filter.status === 'Archived' || item.status !== 'Archived')
      .filter((item) => !filter.status || item.status === filter.status)
      .filter((item) => !filter.type || item.caseType === filter.type)
      .filter((item) => !filter.officerId || item.responsibleOfficerId === filter.officerId)
      .filter((item) => !filter.entityId || item.entityId === filter.entityId)
      .filter((item) => !filter.dateFrom || item.dateOpened >= filter.dateFrom)
      .filter((item) => !filter.dateTo || item.dateOpened <= filter.dateTo)
      .filter((item) => {
        if (!filter.confidentiality) return true;
        return filter.confidentiality === 'confidential' ? item.isConfidential : !item.isConfidential;
      })
      .filter((item) => {
        if (!query) return true;
        const entity = db.entities.find((candidate) => candidate.entityId === item.entityId);
        return [item.id, item.caseNumber, item.caseTitle, item.caseType, entity?.entityName].some((value) => value?.toLowerCase().includes(query));
      });
    return rows.sort((a, b) => {
      if (filter.sortBy === 'caseNumber') return b.caseNumber.localeCompare(a.caseNumber);
      if (filter.sortBy === 'status') return a.status.localeCompare(b.status);
      if (filter.sortBy === 'oldest') return a.dateOpened.localeCompare(b.dateOpened);
      return b.dateOpened.localeCompare(a.dateOpened);
    });
  },
  async getById(id, user) {
    await delay();
    const item = db.cases.find((candidate) => candidate.id === id) ?? null;
    if (!item) return null;
    if (user && !canViewCase(item, user)) {
      await mockAuditService.record({ user: user.name, action: 'View', module: 'Cases', recordRef: `${item.caseNumber} denied` });
      return null;
    }
    if (user && item.isConfidential) await mockAuditService.record({ user: user.name, action: 'View', module: 'Cases', recordRef: item.caseNumber });
    return { ...item };
  },
  async create(input, user) {
    await delay();
    const item: Case = { ...input, id: nanoid(), caseNumber: nextNumber('case', 'CASE'), createdAt: now(), updatedAt: now() };
    db.cases.unshift(item);
    db.activities.unshift({ id: nanoid(), caseId: item.id, type: 'Case created', description: `${item.caseNumber} registered.`, createdBy: user.name, createdAt: now() });
    await mockAuditService.record({ user: user.name, action: 'Create', module: 'Cases', recordRef: item.caseNumber });
    return { ...item };
  },
  async update(id, patch, user, reason) {
    await delay();
    const index = db.cases.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Case not found');
    const prior = db.cases[index];
    if (user) {
      if (!caseAccess('editCases', prior, user)) throw new Error('Not authorized to edit this case');
      const terminal = patch.status === 'Closed' || patch.status === 'Archived';
      if (terminal && patch.status !== prior.status && !caseAccess('closeCases', prior, user)) throw new Error('Not authorized to close or archive this case');
      if (patch.responsibleOfficerId && patch.responsibleOfficerId !== prior.responsibleOfficerId && !caseAccess('assignCases', prior, user)) throw new Error('Not authorized to reassign this case');
    }
    // Closing stamps a close date; reopening to an active status clears it.
    let dateClosed = patch.dateClosed !== undefined ? patch.dateClosed : prior.dateClosed;
    if (patch.status === 'Closed') dateClosed = patch.dateClosed ?? today();
    else if (patch.status && patch.status !== 'Archived') dateClosed = null;
    const next = { ...prior, ...patch, updatedAt: now(), dateClosed };
    db.cases[index] = next;
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Cases', recordRef: next.caseNumber });
    if (patch.status && patch.status !== prior.status) {
      const detail = `Status changed from ${prior.status} to ${patch.status}.${reason ? ` Reason: ${reason}` : ''}`;
      db.activities.unshift({ id: nanoid(), caseId: id, type: 'Status Change', description: detail, createdBy: user.name, createdAt: now() });
      await mockAuditService.record({ user: user.name, action: 'Status Change', module: 'Cases', recordRef: `${next.caseNumber}${reason ? ` — ${reason}` : ''}` });
    }
    if (patch.responsibleOfficerId && patch.responsibleOfficerId !== prior.responsibleOfficerId) {
      const officer = db.users.find((candidate) => candidate.id === patch.responsibleOfficerId);
      db.activities.unshift({ id: nanoid(), caseId: id, type: 'Officer assigned', description: `Responsible officer changed to ${officer?.name ?? patch.responsibleOfficerId}.`, createdBy: user.name, createdAt: now() });
    }
    return { ...next };
  },
  async remove(id, user) {
    await delay();
    const index = db.cases.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [removed] = db.cases.splice(index, 1);
    await mockAuditService.record({ user: user.name, action: 'Delete', module: 'Cases', recordRef: removed.caseNumber });
  },
};
