import { nanoid } from 'nanoid';
import { db, nextNumber } from './db';
import { delay } from './delay';
import { mockAuditService } from './auditService';
import { canApproveCorrespondence, requiredSignoffRole, today } from '@/lib/utils';
import type { Correspondence } from '@/types';
import type { CorrespondenceService } from '../types';

export const mockCorrespondenceService: CorrespondenceService = {
  async getAll(filter = {}) {
    await delay();
    const query = filter.query?.toLowerCase().trim();
    return db.correspondence
      .filter((item) => !filter.direction || item.direction === filter.direction)
      .filter((item) => !filter.status || item.status === filter.status)
      .filter((item) => !filter.category || item.category === filter.category)
      .filter((item) => !filter.priority || item.priority === filter.priority)
      .filter((item) => !filter.confidentiality || item.confidentiality === filter.confidentiality)
      .filter((item) => !filter.entityId || item.entityId === filter.entityId)
      .filter((item) => !filter.caseId || item.caseId === filter.caseId)
      .filter((item) => !filter.dateFrom || item.date >= filter.dateFrom)
      .filter((item) => !filter.dateTo || item.date <= filter.dateTo)
      .filter((item) => !query || [item.id, item.correspondenceNumber, item.subject, item.sender, item.recipient, item.category, ...item.assignedTo].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        if (filter.sortBy === 'correspondenceNumber') return b.correspondenceNumber.localeCompare(a.correspondenceNumber);
        if (filter.sortBy === 'status') return a.status.localeCompare(b.status);
        if (filter.sortBy === 'oldest') return a.date.localeCompare(b.date);
        return b.date.localeCompare(a.date);
      });
  },
  async getById(id) {
    await delay();
    return db.correspondence.find((item) => item.id === id) ?? null;
  },
  async create(input, user) {
    await delay();
    const item: Correspondence = { ...input, id: nanoid(), correspondenceNumber: nextNumber('correspondence', 'COR'), approvedBy: null, approvedAt: null };
    db.correspondence.unshift(item);
    await mockAuditService.record({ user: user.name, action: 'Create', module: 'Correspondence', recordRef: item.correspondenceNumber });
    return { ...item };
  },
  async update(id, patch, user) {
    await delay();
    const index = db.correspondence.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Correspondence not found');
    const prior = db.correspondence[index];
    const next = { ...prior, ...patch, closedDate: patch.status === 'Closed' ? patch.closedDate ?? today() : patch.closedDate ?? prior.closedDate };
    db.correspondence[index] = next;
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Correspondence', recordRef: next.correspondenceNumber });
    if (patch.status && patch.status !== prior.status) await mockAuditService.record({ user: user.name, action: 'Status Change', module: 'Correspondence', recordRef: next.correspondenceNumber });
    return { ...next };
  },
  async approve(id, user) {
    await delay();
    const index = db.correspondence.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Correspondence not found');
    const item = db.correspondence[index];
    if (!canApproveCorrespondence(item, user)) {
      const required = requiredSignoffRole(item);
      await mockAuditService.record({ user: user.name, action: 'Update', module: 'Correspondence', recordRef: `${item.correspondenceNumber} sign-off denied (requires ${required ?? 'N/A'})` });
      throw new Error(`This correspondence must be signed off by ${required ?? 'the correct signatory'}. Your role (${user.role}) is not authorised.`);
    }
    const next = { ...item, approvedBy: user.id, approvedAt: today() };
    db.correspondence[index] = next;
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Correspondence', recordRef: `${next.correspondenceNumber} signed off by ${user.role}` });
    return { ...next };
  },
  async remove(id, user) {
    await delay();
    const index = db.correspondence.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [removed] = db.correspondence.splice(index, 1);
    await mockAuditService.record({ user: user.name, action: 'Delete', module: 'Correspondence', recordRef: removed.correspondenceNumber });
  },
};
