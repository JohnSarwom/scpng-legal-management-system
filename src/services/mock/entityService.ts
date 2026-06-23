import { db, nextEntityId } from './db';
import { delay } from './delay';
import { mockAuditService } from './auditService';
import { now } from '@/lib/utils';
import type { EntityService } from '../types';
import type { Entity } from '@/types';

export const mockEntityService: EntityService = {
  async getAll(filter = {}) {
    await delay();
    const query = filter.query?.toLowerCase().trim();
    return db.entities
      .filter((item) => !filter.status || item.entityStatus === filter.status)
      .filter((item) => !filter.type || item.entityType === filter.type)
      .filter((item) => !filter.source || item.source === filter.source)
      .filter((item) => !query || [item.entityId, item.entityName, item.licenseNumber].some((value) => value?.toLowerCase().includes(query)));
  },
  async getById(id) {
    await delay();
    return db.entities.find((item) => item.entityId === id) ?? null;
  },
  async search(query) {
    await delay();
    const q = query.toLowerCase();
    return db.entities.filter((item) => item.entityName.toLowerCase().includes(q) || item.entityId.toLowerCase().includes(q));
  },
  async create(input, user) {
    await delay();
    // Manually authored entities are always provisional until reconciled with the Licensing system.
    const item: Entity = { ...input, entityId: nextEntityId(), source: 'Manual', entityStatus: 'Pending', createdAt: now(), updatedAt: now() };
    db.entities.unshift(item);
    await mockAuditService.record({ user: user.name, action: 'Create', module: 'Entities', recordRef: `${item.entityId} (provisional)` });
    return { ...item };
  },
  async update(id, patch, user) {
    await delay();
    const index = db.entities.findIndex((item) => item.entityId === id);
    if (index < 0) throw new Error('Entity not found');
    const next = { ...db.entities[index], ...patch, updatedAt: now() };
    db.entities[index] = next;
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Entities', recordRef: next.entityId });
    return { ...next };
  },
  async importMany(rows, user) {
    await delay();
    let created = 0;
    let updated = 0;
    const touched: Entity[] = [];
    for (const row of rows) {
      const existingIndex = row.entityId ? db.entities.findIndex((item) => item.entityId === row.entityId) : -1;
      if (existingIndex >= 0) {
        const next = { ...db.entities[existingIndex], ...row, updatedAt: now() };
        db.entities[existingIndex] = next;
        touched.push(next);
        updated += 1;
      } else {
        const next: Entity = {
          entityStatus: 'Registered',
          entityType: 'Other',
          registrationDetails: '',
          source: 'Imported',
          ...row,
          entityId: row.entityId ?? nextEntityId(),
          createdAt: now(),
          updatedAt: now(),
        };
        db.entities.unshift(next);
        touched.push(next);
        created += 1;
      }
    }
    await mockAuditService.record({ user: user.name, action: 'Update', module: 'Entities', recordRef: `Import: ${created} created, ${updated} updated` });
    return { created, updated, entities: touched };
  },
};
