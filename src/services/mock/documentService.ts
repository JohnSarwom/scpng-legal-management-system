import { nanoid } from 'nanoid';
import { db, nextNumber } from './db';
import { delay } from './delay';
import { mockAuditService } from './auditService';
import { canAccessDocument, today } from '@/lib/utils';
import type { DocumentService } from '../types';
import type { LegalDocument } from '@/types';

export const mockDocumentService: DocumentService = {
  async getAll(filter = {}, user) {
    await delay();
    const query = filter.query?.toLowerCase().trim();
    return db.documents
      .filter((item) => !user || canAccessDocument(item, db.cases, user))
      .filter((item) => !filter.category || item.category === filter.category)
      .filter((item) => !filter.status || item.status === filter.status)
      .filter((item) => !filter.entityId || item.entityId === filter.entityId)
      .filter((item) => !filter.caseId || item.caseId === filter.caseId || (item.relatedCaseIds?.includes(filter.caseId) ?? false))
      .filter((item) => !filter.correspondenceId || item.correspondenceId === filter.correspondenceId)
      .filter((item) => !filter.dateFrom || item.uploadDate >= filter.dateFrom)
      .filter((item) => !filter.dateTo || item.uploadDate <= filter.dateTo)
      .filter((item) => !query || [item.id, item.documentNumber, item.title, item.category].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        if (filter.sortBy === 'documentNumber') return b.documentNumber.localeCompare(a.documentNumber);
        if (filter.sortBy === 'title') return a.title.localeCompare(b.title);
        if (filter.sortBy === 'oldest') return a.uploadDate.localeCompare(b.uploadDate);
        return b.uploadDate.localeCompare(a.uploadDate);
      });
  },
  async getById(id, user) {
    await delay();
    const item = db.documents.find((candidate) => candidate.id === id) ?? null;
    if (!item) return null;
    if (user && !canAccessDocument(item, db.cases, user)) return null;
    return { ...item };
  },
  async create(input, user) {
    await delay();
    const item: LegalDocument = {
      ...input,
      id: nanoid(),
      documentNumber: nextNumber('document', 'DOC'),
      currentVersion: 1,
      versions: [{ version: 1, fileName: input.fileName, updatedBy: user.name, updatedAt: today(), note: input.note ?? 'Initial upload' }],
      uploadedBy: user.id,
      uploadDate: today(),
    };
    db.documents.unshift(item);
    await mockAuditService.record({ user: user.name, action: 'Upload', module: 'Documents', recordRef: item.documentNumber });
    return { ...item };
  },
  async addVersion(id, version, user) {
    await delay();
    const index = db.documents.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Document not found');
    const prior = db.documents[index];
    const nextVersion = prior.currentVersion + 1;
    const next = { ...prior, currentVersion: nextVersion, versions: [...prior.versions, { ...version, version: nextVersion, updatedBy: user.name, updatedAt: today() }] };
    db.documents[index] = next;
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Documents', recordRef: next.documentNumber });
    return { ...next };
  },
  async update(id, patch, user) {
    await delay();
    const index = db.documents.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('Document not found');
    const next = { ...db.documents[index], ...patch } as LegalDocument;
    db.documents[index] = next;
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Documents', recordRef: next.documentNumber });
    return { ...next };
  },
  async remove(id, user) {
    await delay();
    const index = db.documents.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [removed] = db.documents.splice(index, 1);
    await mockAuditService.record({ user: user.name, action: 'Delete', module: 'Documents', recordRef: removed.documentNumber });
  },
  async download(id, user) {
    await delay();
    const item = db.documents.find((candidate) => candidate.id === id);
    if (item) await mockAuditService.record({ user: user.name, action: 'Download', module: 'Documents', recordRef: item.documentNumber });
  },
};
