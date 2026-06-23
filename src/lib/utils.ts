import { PERMISSIONS, type Action } from '@/config/permissions';
import type { Case, LegalDocument, User } from '@/types';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  return value.slice(0, 10);
}

export function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function now() {
  return new Date().toISOString();
}

export function canAccessConfidentialCase(item: Case, user: User) {
  if (!item.isConfidential) return true;
  if (user.role === 'CEO' || user.role === 'General Counsel') return true;
  if (user.role === 'Executive Officer') return item.grantedUserIds?.includes(user.id) ?? false;
  return item.responsibleOfficerId === user.id || (item.grantedUserIds?.includes(user.id) ?? false);
}

export function isAssignedToCase(item: Case, user: User) {
  return item.responsibleOfficerId === user.id || (item.grantedUserIds?.includes(user.id) ?? false);
}

// Edit-level grant: only meaningful for roles whose `editCases` tier is `assigned`
// (currently Legal Officer) — those are the only ones where view and write can differ per person.
export function hasEditGrant(item: Case, user: User) {
  return item.responsibleOfficerId === user.id || (item.grantedEditUserIds?.includes(user.id) ?? false);
}

// Resolves a per-case permission for an action, honouring the `assigned` tier:
// `assigned` roles are only authorised on cases they own or have been granted.
// `editCases` uses the separate edit-grant list so a person can be given read-only
// access to a case without also being able to change it.
export function caseAccess(action: Action, item: Case, user: User) {
  const access = PERMISSIONS[action][user.role];
  if (access === 'none') return false;
  if (access === 'assigned') return action === 'editCases' ? hasEditGrant(item, user) : isAssignedToCase(item, user);
  return true;
}

// Combines confidentiality access with the `viewCases` scope so list and detail
// agree on which cases a role may see.
export function canViewCase(item: Case, user: User) {
  if (!canAccessConfidentialCase(item, user)) return false;
  return caseAccess('viewCases', item, user);
}

export function canAccessDocument(document: LegalDocument, cases: Case[], user: User) {
  if (!document.isConfidential && document.classification !== 'Executive-Confidential') return true;
  if (user.role === 'CEO' || user.role === 'General Counsel') return true;
  const linkedCase = document.caseId ? cases.find((item) => item.id === document.caseId) : null;
  if (!linkedCase) return user.role !== 'Executive Officer';
  return canAccessConfidentialCase(linkedCase, user);
}

export function csvDownload(fileName: string, rows: Array<Record<string, string | number | null | undefined>>) {
  const headers = Object.keys(rows[0] ?? { empty: '' });
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
