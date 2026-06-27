import { nanoid } from 'nanoid';
import type { Notification, NotificationEntityType, NotificationType } from '@/types';
import { delay } from './delay';

// In-memory store — resets on page refresh (same pattern as db.ts)
const store: Notification[] = [
  // Legal Manager (u-lm) — Tyson Yapao
  {
    id: 'notif-1',
    recipientId: 'u-lm',
    type: 'case_assigned',
    title: 'Matter assigned to you',
    body: 'MATT-2026-001 "Sepik Securities licence suspension appeal" has been assigned to you.',
    entityType: 'case',
    entityId: 'case-1',
    linkTo: '/cases/case-1',
    read: false,
    createdAt: '2026-06-20T08:10:00Z',
  },
  {
    id: 'notif-2',
    recipientId: 'u-lm',
    type: 'correspondence_pending_approval',
    title: 'Correspondence pending approval',
    body: 'COR-2026-005 "Board delegation advice request" requires your approval.',
    entityType: 'correspondence',
    entityId: 'corr-5',
    linkTo: '/correspondence/corr-5',
    read: false,
    createdAt: '2026-06-21T09:30:00Z',
  },
  {
    id: 'notif-3',
    recipientId: 'u-lm',
    type: 'document_uploaded',
    title: 'New document uploaded',
    body: 'DOC-2026-008 "Board Delegation Note" was uploaded and linked to MATT-2026-008.',
    entityType: 'document',
    entityId: 'doc-8',
    linkTo: '/documents/doc-8',
    read: true,
    createdAt: '2026-06-19T14:00:00Z',
  },

  // General Counsel (u-gc) — Andy Ambulu
  {
    id: 'notif-4',
    recipientId: 'u-gc',
    type: 'correspondence_pending_approval',
    title: 'Correspondence pending approval',
    body: 'COR-2026-002 "Kumul inquiry holding response" is awaiting your approval before dispatch.',
    entityType: 'correspondence',
    entityId: 'corr-2',
    linkTo: '/correspondence/corr-2',
    read: false,
    createdAt: '2026-06-22T07:45:00Z',
  },
  {
    id: 'notif-5',
    recipientId: 'u-gc',
    type: 'case_status_changed',
    title: 'Matter status updated',
    body: 'MATT-2026-005 "Madang Growth revocation litigation" moved to Open.',
    entityType: 'case',
    entityId: 'case-5',
    linkTo: '/cases/case-5',
    read: false,
    createdAt: '2026-06-23T10:00:00Z',
  },

  // Senior Legal Officer (u-sr) — Isaac Mel
  {
    id: 'notif-6',
    recipientId: 'u-sr',
    type: 'case_assigned',
    title: 'Matter assigned to you',
    body: 'MATT-2026-003 "Employment disciplinary review" has been assigned to you.',
    entityType: 'case',
    entityId: 'case-3',
    linkTo: '/cases/case-3',
    read: false,
    createdAt: '2026-06-21T11:15:00Z',
  },
  {
    id: 'notif-7',
    recipientId: 'u-sr',
    type: 'document_uploaded',
    title: 'New document uploaded',
    body: 'DOC-2026-003 "Employment Advice Draft" was added to your case.',
    entityType: 'document',
    entityId: 'doc-3',
    linkTo: '/documents/doc-3',
    read: true,
    createdAt: '2026-06-18T09:00:00Z',
  },

  // Legal Officer (u-lo1) — Immanuel Minoga
  {
    id: 'notif-8',
    recipientId: 'u-lo1',
    type: 'case_assigned',
    title: 'Matter assigned to you',
    body: 'MATT-2026-004 "PNG Infrastructure Notes prospectus review" has been assigned to you.',
    entityType: 'case',
    entityId: 'case-4',
    linkTo: '/cases/case-4',
    read: false,
    createdAt: '2026-06-20T08:30:00Z',
  },
  {
    id: 'notif-9',
    recipientId: 'u-lo1',
    type: 'correspondence_approved',
    title: 'Correspondence approved',
    body: 'COR-2026-006 "Custody compliance notice dispatch" has been approved and dispatched.',
    entityType: 'correspondence',
    entityId: 'corr-6',
    linkTo: '/correspondence/corr-6',
    read: true,
    createdAt: '2026-06-19T16:00:00Z',
  },

  // Executive Officer (u-eo) — Ninipe Gurumo
  {
    id: 'notif-10',
    recipientId: 'u-eo',
    type: 'case_created',
    title: 'New matter opened',
    body: 'MATT-2026-012 "New Guinea Energy continuous disclosure matter" has been opened.',
    entityType: 'case',
    entityId: 'case-12',
    linkTo: '/cases/case-12',
    read: false,
    createdAt: '2026-06-22T13:00:00Z',
  },

  // CEO (u-ceo) — James Joshua
  {
    id: 'notif-11',
    recipientId: 'u-ceo',
    type: 'case_status_changed',
    title: 'Matter status updated',
    body: 'MATT-2026-001 "Sepik Securities licence suspension appeal" is now Under Review.',
    entityType: 'case',
    entityId: 'case-1',
    linkTo: '/cases/case-1',
    read: false,
    createdAt: '2026-06-23T08:00:00Z',
  },
];

export interface NotificationService {
  getForUser(userId: string): Promise<Notification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  push(payload: {
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityType: NotificationEntityType;
    entityId: string;
    linkTo: string;
  }): void;
}

export const mockNotificationService: NotificationService = {
  async getForUser(userId) {
    await delay(120);
    return store.filter((n) => n.recipientId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async markRead(id) {
    await delay(80);
    const notif = store.find((n) => n.id === id);
    if (notif) notif.read = true;
  },

  async markAllRead(userId) {
    await delay(80);
    store.filter((n) => n.recipientId === userId).forEach((n) => { n.read = true; });
  },

  push({ recipientId, type, title, body, entityType, entityId, linkTo }) {
    store.unshift({
      id: nanoid(),
      recipientId,
      type,
      title,
      body,
      entityType,
      entityId,
      linkTo,
      read: false,
      createdAt: new Date().toISOString(),
    });
  },
};
