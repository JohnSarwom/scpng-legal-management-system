import { nanoid } from 'nanoid';
import { db } from './db';
import { delay } from './delay';
import { mockAuditService } from './auditService';
import { now } from '@/lib/utils';
import type { NoteService } from '../types';

export const mockNoteService: NoteService = {
  async getByCase(caseId) {
    await delay();
    return db.notes.filter((item) => item.caseId === caseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async create(caseId, body, user) {
    await delay();
    const note = { id: nanoid(), caseId, body, createdBy: user.name, createdAt: now() };
    db.notes.unshift(note);
    db.activities.unshift({ id: nanoid(), caseId, type: 'Note added', description: body, createdBy: user.name, createdAt: now() });
    const linkedCase = db.cases.find((item) => item.id === caseId);
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Cases', recordRef: linkedCase?.caseNumber ?? caseId });
    return note;
  },
};
