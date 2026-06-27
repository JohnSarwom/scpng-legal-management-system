import { twMerge } from 'tailwind-merge';
import { CONFIDENTIALITY_RANK, type ConfidentialityLevel } from '@/config/enums';
import { PERMISSIONS, type Action } from '@/config/permissions';
import type { Case, Correspondence, LegalDocument, User } from '@/types';

export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(' '));
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

/** Can this user see the CONTENT of a record at the given confidentiality level? (Decision #11)
 *  Executive Confidential: CEO only. Confidential: Senior+ or granted. Restricted/Public: all. */
export function canViewConfidentialContent(level: ConfidentialityLevel, user: User, hasGrant: boolean): boolean {
  if (level === 'Executive Confidential') return user.role === 'CEO';
  if (level === 'Confidential') return ['CEO', 'General Counsel', 'Legal Manager'].includes(user.role) || hasGrant;
  return true; // Restricted and Public are readable by all authorised module users
}

export function canAccessConfidentialCase(item: Case, user: User) {
  const rank = CONFIDENTIALITY_RANK[item.confidentiality];
  if (rank < 2) return true; // Public or Restricted — visible to all
  // Executive Confidential: CEO only (not even General Counsel — Decision #11)
  if (item.confidentiality === 'Executive Confidential') return user.role === 'CEO';
  // Confidential: role-based + grants
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

/** Returns the role required to sign off an outgoing correspondence item, or null for incoming. */
export function requiredSignoffRole(c: Correspondence): 'CEO' | 'General Counsel' | null {
  if (c.direction !== 'Outgoing') return null;
  return c.isLegalMatter ? 'General Counsel' : 'CEO';
}

/** Returns true only when the given user is the correct signatory for this correspondence item. */
export function canApproveCorrespondence(c: Correspondence, user: User): boolean {
  const required = requiredSignoffRole(c);
  return required !== null && user.role === required;
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
