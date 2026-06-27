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
      .filter((item) => !filter.division || item.caseDivision === filter.division)
      .filter((item) => !filter.subType || item.caseSubType === filter.subType)
      .filter((item) => !filter.officerId || item.responsibleOfficerId === filter.officerId)
      .filter((item) => !filter.entityId || item.entityId === filter.entityId)
      .filter((item) => !filter.highRisk || item.isHighRisk)
      .filter((item) => !filter.dateFrom || item.dateOpened >= filter.dateFrom)
      .filter((item) => !filter.dateTo || item.dateOpened <= filter.dateTo)
      .filter((item) => !filter.confidentiality || item.confidentiality === filter.confidentiality)
      .filter((item) => {
        if (!query) return true;
        const entity = db.entities.find((candidate) => candidate.entityId === item.entityId);
        return [item.id, item.caseNumber, item.caseTitle, item.caseDivision, item.caseSubType, entity?.entityName].some((value) => value?.toLowerCase().includes(query));
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
    if (user && item.confidentiality !== 'Public') await mockAuditService.record({ user: user.name, action: 'View', module: 'Cases', recordRef: item.caseNumber });
    // Executive Confidential: content redacted for non-CEO (Decision #11)
    if (user && item.confidentiality === 'Executive Confidential' && user.role !== 'CEO') {
      return { ...item, description: '— Content restricted: Executive Confidential (CEO only) —' };
    }
    return { ...item };
  },
  async create(input, user) {
    await delay();
    const item: Case = { ...input, id: nanoid(), caseNumber: nextNumber('case', 'MATT'), createdAt: now(), updatedAt: now() };
    db.cases.unshift(item);
    db.activities.unshift({ id: nanoid(), caseId: item.id, type: 'Matter registered', description: `${item.caseNumber} registered.`, createdBy: user.name, createdAt: now() });
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
      if (patch.status && patch.status !== prior.status) {
        if ((patch.status === 'Closed' || patch.status === 'Archived') && !caseAccess('approveClosure', prior, user))
          throw new Error('Not authorized to close or archive this case — General Counsel approval required');
        if (patch.status === 'Pending Closure' && !caseAccess('initiateClosure', prior, user))
          throw new Error('Not authorized to submit this case for closure');
      }
      if ('isHighRisk' in patch && patch.isHighRisk !== prior.isHighRisk && !caseAccess('setHighRisk', prior, user))
        throw new Error('Not authorized to set the High Risk flag on this case');
      if (patch.responsibleOfficerId && patch.responsibleOfficerId !== prior.responsibleOfficerId && !caseAccess('assignCases', prior, user)) throw new Error('Not authorized to reassign this case');
    }
    // Closing stamps a close date; reopening to an active status clears it.
    let dateClosed = patch.dateClosed !== undefined ? patch.dateClosed : prior.dateClosed;
    if (patch.status === 'Closed') dateClosed = patch.dateClosed ?? today();
    else if (patch.status && patch.status !== 'Archived' && patch.status !== 'Pending Closure') dateClosed = null;
    // Closure workflow stamps
    let closureInitiatedBy = prior.closureInitiatedBy ?? null;
    let closureApprovedBy = prior.closureApprovedBy ?? null;
    let closureApprovedAt = prior.closureApprovedAt ?? null;
    if (patch.status === 'Pending Closure' && prior.status !== 'Pending Closure') closureInitiatedBy = user.id;
    if ((patch.status === 'Closed' || patch.status === 'Archived') && prior.status === 'Pending Closure') {
      closureApprovedBy = user.id;
      closureApprovedAt = today();
    }
    if (patch.status && !['Closed', 'Archived', 'Pending Closure'].includes(patch.status)) {
      closureInitiatedBy = null; closureApprovedBy = null; closureApprovedAt = null;
    }
    // High risk stamps
    let highRiskSetBy = prior.highRiskSetBy ?? null;
    let highRiskSetAt = prior.highRiskSetAt ?? null;
    if ('isHighRisk' in patch && patch.isHighRisk && !prior.isHighRisk) { highRiskSetBy = user.id; highRiskSetAt = today(); }
    if ('isHighRisk' in patch && !patch.isHighRisk) { highRiskSetBy = null; highRiskSetAt = null; }
    const next = { ...prior, ...patch, updatedAt: now(), dateClosed, closureInitiatedBy, closureApprovedBy, closureApprovedAt, highRiskSetBy, highRiskSetAt };
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
    if ('isHighRisk' in patch && patch.isHighRisk !== prior.isHighRisk) {
      const label = patch.isHighRisk ? 'Flagged as High Risk' : 'High Risk flag removed';
      db.activities.unshift({ id: nanoid(), caseId: id, type: label, description: `${label} by ${user.name}.`, createdBy: user.name, createdAt: now() });
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
