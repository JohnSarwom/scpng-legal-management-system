import { db } from './db';
import { delay } from './delay';
import { canAccessConfidentialCase, canAccessDocument } from '@/lib/utils';
import type { SearchService } from '../types';

export const mockSearchService: SearchService = {
  async search(query, user, kind = 'all') {
    await delay();
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const assignedOnly = ['Senior Legal Officer', 'Legal Officer', 'Executive Officer'].includes(user.role);
    const results = [];
    if (kind === 'all' || kind === 'entity') {
      results.push(...db.entities.filter((item) => [item.entityId, item.entityName, item.entityStatus].some((value) => value.toLowerCase().includes(q))).map((record) => ({ kind: 'entity' as const, record, context: record.registrationDetails })));
    }
    if (kind === 'all' || kind === 'case') {
      results.push(...db.cases.filter((item) => canAccessConfidentialCase(item, user)).filter((item) => !assignedOnly || item.responsibleOfficerId === user.id || item.grantedUserIds?.includes(user.id)).filter((item) => [item.id, item.caseNumber, item.caseTitle, item.caseDivision, item.caseSubType].some((value) => value.toLowerCase().includes(q))).map((record) => ({ kind: 'case' as const, record, context: record.description })));
    }
    if (kind === 'all' || kind === 'document') {
      results.push(...db.documents.filter((item) => canAccessDocument(item, db.cases, user)).filter((item) => [item.id, item.documentNumber, item.title, item.category].some((value) => value.toLowerCase().includes(q))).map((record) => ({ kind: 'document' as const, record, context: record.category })));
    }
    if (kind === 'all' || kind === 'correspondence') {
      results.push(...db.correspondence.filter((item) => [item.id, item.correspondenceNumber, item.subject, item.sender, item.recipient].some((value) => value.toLowerCase().includes(q))).map((record) => ({ kind: 'correspondence' as const, record, context: `${record.direction} from ${record.sender}` })));
    }
    return results;
  },
};
