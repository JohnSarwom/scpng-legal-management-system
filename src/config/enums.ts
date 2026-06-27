export const CASE_STATUSES = ['Draft', 'Open', 'Pending', 'Under Review', 'Pending Closure', 'Closed', 'Archived'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_DIVISIONS = [
  'Enforcement & Compliance',
  'Legal Advisory',
  'Executive & Secretariat',
] as const;
export type CaseDivision = (typeof CASE_DIVISIONS)[number];

/** Sub-types per division — edit this single object to add/rename sub-types after WS#2. */
export const CASE_SUB_TYPES: Record<CaseDivision, readonly string[]> = {
  'Enforcement & Compliance': ['Litigation', 'Compliance'],
  'Legal Advisory': ['Contracts', 'In-house legal advice'],
  'Executive & Secretariat': ['Board/executive matters'],
};

export type CaseSubType = string; // loosely typed until WS#2 finalises the list
export const ALL_CASE_SUB_TYPES: string[] = Object.values(CASE_SUB_TYPES).flat();

export const TEMPLATE_TYPES = [
  'Standard Notice',
  'WSP Form',
  'Contract Precedent',
  'Letter Template',
  'Compliance Form',
  'Other',
] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const DOCUMENT_CATEGORIES = [
  'Contracts',
  'Court Documents',
  'Affidavits',
  'Agreements',
  'Compliance Documents',
  'Legal Opinions',
  'Internal Memos',
  'External Correspondence',
  'Gazettal Notices (Internal)',
  'Gazettal Notices (External)',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const CORRESPONDENCE_DIRECTIONS = ['Incoming', 'Outgoing'] as const;
export type CorrespondenceDirection = (typeof CORRESPONDENCE_DIRECTIONS)[number];

export const CORRESPONDENCE_CATEGORIES = [
  'Ministerial Communications',
  'Board Communications',
  'Regulatory Communications',
  'Stakeholder Letters',
  'Investor Correspondence',
  'Government Agency Communications',
  'International Partner Communications',
  'Complaints Escalated to CEO',
  'Invitations & Event Correspondence',
  'Internal Executive Directives',
] as const;
export type CorrespondenceCategory = (typeof CORRESPONDENCE_CATEGORIES)[number];

export const CORRESPONDENCE_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export type CorrespondencePriority = (typeof CORRESPONDENCE_PRIORITIES)[number];

export const CORRESPONDENCE_CONFIDENTIALITY = ['Public', 'Restricted', 'Confidential', 'Executive Confidential'] as const;
export type CorrespondenceConfidentiality = (typeof CORRESPONDENCE_CONFIDENTIALITY)[number];

/** Canonical 4-level scheme shared by Cases, Documents, and Correspondence (Decision #10). */
export const CONFIDENTIALITY_LEVELS = CORRESPONDENCE_CONFIDENTIALITY;
export type ConfidentialityLevel = CorrespondenceConfidentiality;

/** Ordered rank — use for range comparisons (e.g. "at least Confidential"). */
export const CONFIDENTIALITY_RANK: Record<ConfidentialityLevel, number> = {
  Public: 0, Restricted: 1, Confidential: 2, 'Executive Confidential': 3,
};

export const CORRESPONDENCE_ACTIONS = ['Response', 'Review', 'Approval', 'Information Only'] as const;
export type CorrespondenceAction = (typeof CORRESPONDENCE_ACTIONS)[number];

export const CORRESPONDENCE_STATUSES = ['Open', 'In Progress', 'Under Review', 'Investigating', 'Awaiting Response', 'Responded', 'Closed'] as const;
export type CorrespondenceStatus = (typeof CORRESPONDENCE_STATUSES)[number];

export const ROLES = [
  'CEO',
  'General Counsel',
  'Legal Manager',
  'Senior Legal Officer',
  'Legal Officer',
  'Executive Officer',
] as const;
export type Role = (typeof ROLES)[number];

export const CONFIDENTIAL_CLASSES = [
  'Executive Investigations',
  'Litigation Matters',
  'Employment Disciplinary Cases',
  'Board Matters',
  'Regulatory Investigations',
] as const;
export type ConfidentialClass = (typeof CONFIDENTIAL_CLASSES)[number];

export const ENTITY_STATUSES = ['Registered', 'Suspended', 'Revoked', 'Pending'] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export const ENTITY_TYPES = [
  'Broker-Dealer',
  'Fund Manager',
  'Listed Issuer',
  'Trustee/Custodian',
  'Investment Adviser',
  'Market Participant',
  'Other',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_SOURCES = ['Licensing', 'Imported', 'Manual'] as const;
export type EntitySource = (typeof ENTITY_SOURCES)[number];
