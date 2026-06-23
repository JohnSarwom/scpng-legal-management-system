import { nanoid } from 'nanoid';
import { db } from './db';
import { delay } from './delay';
import { now } from '@/lib/utils';
import type { AuditService } from '../types';

export const mockAuditService: AuditService = {
  async getAll() {
    await delay();
    return [...db.audit].sort((a, b) => b.date.localeCompare(a.date));
  },
  async record(input) {
    const entry = { ...input, id: nanoid(), date: now() };
    db.audit.unshift(entry);
    return entry;
  },
};
